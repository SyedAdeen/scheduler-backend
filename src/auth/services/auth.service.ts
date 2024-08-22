import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { instanceToInstance, instanceToPlain } from "class-transformer";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "@entities/user.entity";
import * as _ from "lodash";
import { MailerService } from "../../common/Services/MailService";
import { RedisClientType } from "@redis/client";
import { v4 as uuid } from 'uuid';
import {InvalidCodeException, TokenExpiredException,EmailExist, UserNotFound, SignInWithGoogle, UnauthorizedException,BadRequestException} from '../../common/Exceptions/exception.handler';
import { OAuth2Client } from 'google-auth-library'; // Import the Google client

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailerService,
        @Inject("REDIS") private readonly redisClient: RedisClientType,
        @Inject('GOOGLE_CLIENT') private readonly googleClient: OAuth2Client 

    ) {}

    async register(name: string, email: string, password: string): Promise<string> {
        try {
            // Check if user already exists
            let user = await this.userRepository.findOne({ where: { email }});
            const encryptedPassword = await bcrypt.hash(password, 10);
            
            if (user) {
                if (user.verified) {
                    throw new EmailExist();
                } else {
                    // Update existing user
                    user.name = name;
                    user.password = encryptedPassword;
                    user.type = 0;
                    await this.userRepository.save(user);
                }
            } else {
                // Create a new user
                user = this.userRepository.create({
                    email,
                    name,
                    password: encryptedPassword,
                    type: 0,
                    verified: false,
                });
                await this.userRepository.save(user);
            }

            // Generate and store JWT token
            const randomToken = uuid();
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const payload = {
                email,
                code: randomDigits.toString(),
            };
            const jwtToken = this.jwtService.sign(payload, { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' });
            await this.redisClient.set(randomToken, jwtToken);

            // Send registration email
            await this.mailService.sendRegistrationEmail(email,randomDigits);

            return randomToken;
        } catch (error) {
            console.error('Error in register function:', error);
            throw error;
        }
    }


    async verifyRegistration(token: string, code: number): Promise<boolean> {
        try {
            const jwtToken = await this.redisClient.get(token);
            if (!jwtToken) {
                throw new TokenExpiredException();
            }

            const payload = this.jwtService.verify(jwtToken, {secret: this.configService.get('JWT_SECRET')}) as { email: string; code: number };
            if (code !== payload.code) {
                throw new InvalidCodeException();
            }

            const user = await this.userRepository.findOne({ where: { email: payload.email }});
            if (!user) {
                throw new Error('User not found');
            }

            user.verified = true;
            await this.userRepository.save(user);
            await this.redisClient.del(token);
            return true;
        } catch (error) {
            console.error('Error in registration verification:', error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            // Find user by email and ensure they are verified
            const user = await this.userRepository.findOne({ where: { email, verified: true } });

            if (!user) {
                throw new UserNotFound();
            }

            // Check if the user has a password
            if (user.password === null) {
                throw new SignInWithGoogle();
            }

            // Verify the password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException("Incorrect Password");
            }

            // Generate a JWT token
            const token = this.jwtService.sign({id:user.id}, { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' });

            return { user, token };

        } catch (error) {
            console.error('Error in login function:', error);
            throw error;
        }
    }


    async googleAuthService(idToken: string): Promise<{ user: User; token: string }> {
        try {
            console.log("Client Id Of Google:", this.configService.get<string>('GOOGLE_CLIENT_ID'));
            // Verify the Google ID token
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                // audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });

            // Extract user information from the token payload
            const { email, name, sub: googleid } = ticket.getPayload();

            // Initialize user object
            let user = await this.userRepository.findOne({ where: { email } });

            // Handle existing user
            if (user) {
                if (user.googleid) {
                    // If the Google ID matches, return a JWT token
                    if (user.googleid === googleid) {
                        console.log("Google Id Matches");
                        const token = this.jwtService.sign({ id: user.id }, { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' });
                        return { user, token };
                    }
                } else {
                    // Update existing user with Google ID if not already set
                    console.log("Updating existing user with Google ID");
                    user.googleid = googleid;
                    user.verified = true; // Mark as verified since signed in with Google
                    user.password = null;
                    await this.userRepository.save(user);
                }
            } else {
                // Create a new user
                console.log("Creating new user");

                user = this.userRepository.create({
                    email,
                    name,
                    googleid,
                    verified: true,  // Google users can be considered verified,
                    type:0,
                });
                await this.userRepository.save(user); // Save the new user
            }

            // Generate and return JWT token for the user
            const token = this.jwtService.sign({ id: user.id }, { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' });
            return { user, token };

        } catch (error) {
            console.error("Error in Google Authentication Service:", error);
            throw error;
        }
    }

    async forgotPassword(email: string): Promise<string> {
        const user = await this.userRepository.findOne({ where: { email, verified: true } });
        if (!user) {
            throw new UnauthorizedException('Email Not Found');
        }

        if(user.password===null)
        {
            throw new SignInWithGoogle();
        }

        const token = uuid(); // Generate a unique token
        const randomDigits = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a 4-digit code
        const payload = {
            email,
            code: randomDigits.toString(),
        };
        const jwtToken = this.jwtService.sign(payload, { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' });
        await this.redisClient.set(token, jwtToken); // Store the JWT token in Redis
        await this.mailService.sendForgotPasswordEmail(email,parseInt(randomDigits)); // Send email with the reset code

        return token;
    }


    async verifyForgotPassword(token: string, code: number, newPassword: string): Promise<{ message: string }> {
        try {
            // Get the value from Redis using the token as the key
            const redisValue = await this.redisClient.get(token);
            if (!redisValue) {
                throw new UnauthorizedException("Token not found");
            }

            // Verify the JWT stored in the Redis value
            const decoded: any = this.jwtService.verify(redisValue, { secret: this.configService.get<string>('JWT_SECRET') });
            if (decoded.code !== code) {
                throw new UnauthorizedException("Code is incorrect");
            }

            // Get the user by email from the payload and update the password
            const user = await this.userRepository.findOne({ where: { email: decoded.email, verified: true } });
            if (!user) {
                throw new UnauthorizedException("User not found");
            }

            // Encrypt the new password and update the user record
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await this.userRepository.save(user);

            // Delete the token from Redis
            await this.redisClient.del(token);

            return { message: "Password changed successfully" };
        } catch (error) {
            throw error;
        }
    }


    async validate(email: string, password: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user) {
            return null;
        }
        const matched = await bcrypt.compare(password, user.password);
        if (!matched) {
            return null;
        }
        return instanceToInstance(user);
    }

 
    async getByEmail(email: string) {
        return this.userRepository.findOneBy({ email });
    }


}
