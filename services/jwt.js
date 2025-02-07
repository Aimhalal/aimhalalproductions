import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
import Jwt from "jsonwebtoken";

class JwtService {
  static sign(payload, expiry = "1y", secret = JWT_SECRET) {
    return Jwt.sign(payload, secret, { expiresIn: expiry });
  }
  static verify(token, secret = JWT_SECRET) {
    return Jwt.verify(token, secret);
  }
}

export default JwtService;
