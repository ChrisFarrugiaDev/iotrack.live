import { Request, Response, NextFunction} from "express";
import { User } from "../../models/user.model";
import { Organisation } from "../../models/organisation.model";

class AuthController {

    static generateToken() {

    }

    // -----------------------------------------------------------------
    // Login a user
    // -----------------------------------------------------------------

    static async login (req: Request, res: Response, next: NextFunction) {
        let { email, password } = req.body;

        console.log(email, password);

        const user = await User.getByEmail(email);
        console.log(user)
        if (user) {
            const org = await Organisation.getById(user.organisation_id.toString())
            console.log(org)
        }
    }

    // -----------------------------------------------------------------
    // Logout a user
    // -----------------------------------------------------------------

    static async logout(req: Request, res: Response, next: NextFunction) {  
        
    }
}

export default AuthController;