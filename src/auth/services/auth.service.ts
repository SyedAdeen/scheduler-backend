import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { instanceToInstance, instanceToPlain } from "class-transformer";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "@entities/user.entity";
import * as _ from "lodash";
<<<<<<< Updated upstream
import { MailerService } from "@nestjs-modules/mailer";
import { RedisClientType } from "@redis/client";
=======
import { MailerService } from "../../common/services/MailService";
import { RedisClientType } from "@redis/client";
import { v4 as uuid } from 'uuid';
import {InvalidCodeException, TokenExpiredException,EmailExist, UserNotFound, SignInWithGoogle, UnauthorizedException,BadRequestException} from '../../common/exceptions/exception.handler';
import { OAuth2Client } from 'google-auth-library'; // Import the Google client
>>>>>>> Stashed changes

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly mailService: MailerService,
        @Inject("REDIS") private readonly redisClient: RedisClientType
    ) {}

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

<<<<<<< Updated upstream
    async authenticate(username: string, password: string): Promise<User> {
        const user = await this.validate(username, password);
        if (!user) {
            throw new UnauthorizedException("Unauthorized");
        }
        const updatedUser = _.cloneDeep(user);
        updatedUser.company = _.omit(updatedUser.company, "menu");
        const jwtToken = this.jwtService.sign(instanceToPlain(updatedUser), {
            secret: this.configService.get("ACCESS_TOKEN_SECRET"),
        });
        return { ...user, accessToken: jwtToken };
    }

    async encryptPassword(password: string) {
        return bcrypt.hash(password, 10);
    }

    async forgotPassword(email: string): Promise<boolean> {
        return null;
    }

    async resetPassword(token: string, code: string, password: string): Promise<boolean> {
        return null;
    }

    async changePassword(password: string, userId: number) {
        return null;
    }

    async getByEmail(email: string) {
        return this.userRepository.findOneBy({ email });
=======
 
    async getById(id: number) {
        return this.userRepository.findOneBy({ id });
>>>>>>> Stashed changes
    }

    async getUser(userId: number): Promise<User> {
        return this.userRepository.findOneBy({
            id: userId,
        });
    }

    async removeUser(userId: number): Promise<boolean> {
        const response = await this.userRepository.delete({
            id: userId,
        });
        return response.affected > 0;
    }
}
