import express from 'express';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';


const profileRoute = express.Router();

profileRoute.patch("/update", auth(userRole.admin, userRole.company, userRole.driver))


export default profileRoute;