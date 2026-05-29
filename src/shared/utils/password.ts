import { BCRYPT_SALT_ROUNDS } from "@shared/constants/security.constants";
import bcrypt from "bcrypt";

export const hashPassword = (password: string): Promise<string> =>
    bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

export const verifyPassword = (
    password: string,
    hashedPassword: string,
): Promise<boolean> => bcrypt.compare(password, hashedPassword);
