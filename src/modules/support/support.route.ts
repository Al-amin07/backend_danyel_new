import { Router } from 'express';
import { supportController } from './support.controller';

const route = Router();

route.post('/', supportController.createSupport);
route.get('/', supportController.getAllSupport);
route.get('/:id', supportController.getSingleSupport);

export const supportRoute = route;
