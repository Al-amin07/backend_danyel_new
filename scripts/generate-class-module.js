#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('❌ Please provide a module name.');
  process.exit(1);
}

const basePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
const files = [
  {
    name: `${moduleName}.controller.ts`,
    content: `import { Request, Response } from 'express';
import ${capitalizeFirstLetter(moduleName)}Service from './${moduleName}.service';
import { create${capitalizeFirstLetter(moduleName)}Schema, update${capitalizeFirstLetter(moduleName)}Schema } from './${moduleName}.validation';
import { ZodError } from 'zod';

class ${capitalizeFirstLetter(moduleName)}Controller {
  private ${moduleName}Service: ${capitalizeFirstLetter(moduleName)}Service;

  constructor() {
    this.${moduleName}Service = new ${capitalizeFirstLetter(moduleName)}Service();
  }

  async create(req: Request, res: Response) {
    try {
      create${capitalizeFirstLetter(moduleName)}Schema.parse(req.body); // Validate body
      const result = await this.${moduleName}Service.create(req.body);
      res.status(201).json({
        success: true,
        message: '${capitalizeFirstLetter(moduleName)} created successfully',
        data: result,
      });
    } catch (err : any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors,
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await this.${moduleName}Service.getAll();
      res.status(200).json({
        success: true,
        message: '${capitalizeFirstLetter(moduleName)}s retrieved successfully',
        data: result,
      });
    } catch (err : any) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await this.${moduleName}Service.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: '${capitalizeFirstLetter(moduleName)} retrieved successfully',
        data: result,
      });
    } catch (err : any) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      update${capitalizeFirstLetter(moduleName)}Schema.parse(req.body); // Validate body
      const result = await this.${moduleName}Service.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: '${capitalizeFirstLetter(moduleName)} updated successfully',
        data: result,
      });
    } catch (err : any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors,
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }

  async softDelete(req: Request, res: Response) {
    try {
      const result = await this.${moduleName}Service.softDelete(req.params.id);
      res.status(200).json({
        success: true,
        message: '${capitalizeFirstLetter(moduleName)} soft deleted successfully',
        data: result,
      });
    } catch (err : any) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }
}

export default new ${capitalizeFirstLetter(moduleName)}Controller();
`
  },
  {
    name: `${moduleName}.validation.ts`,
    content: `import { z } from 'zod';

export const create${capitalizeFirstLetter(moduleName)}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

export const update${capitalizeFirstLetter(moduleName)}Schema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
});
`
  },
  {
    name: `${moduleName}.service.ts`,
    content: `import ${capitalizeFirstLetter(moduleName)}Model from './${moduleName}.model';
import { ${capitalizeFirstLetter(moduleName)} } from './${moduleName}.interface';

class ${capitalizeFirstLetter(moduleName)}Service {
  async create(data: ${capitalizeFirstLetter(moduleName)}) {
    const new${capitalizeFirstLetter(moduleName)} = await ${capitalizeFirstLetter(moduleName)}Model.create(data);
    return new${capitalizeFirstLetter(moduleName)};
  }

  async getAll() {
    const ${moduleName}s = await ${capitalizeFirstLetter(moduleName)}Model.find({ isDeleted: false });
    return ${moduleName}s;
  }

  async getById(id: string) {
    const ${moduleName} = await ${capitalizeFirstLetter(moduleName)}Model.findOne({ _id: id, isDeleted: false });
    return ${moduleName};
  }

  async update(id: string, data: Partial<${capitalizeFirstLetter(moduleName)}>) {
    const updated${capitalizeFirstLetter(moduleName)} = await ${capitalizeFirstLetter(moduleName)}Model.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true }
    );
    return updated${capitalizeFirstLetter(moduleName)};
  }

  async softDelete(id: string) {
    const result = await ${capitalizeFirstLetter(moduleName)}Model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
  }
}

export default ${capitalizeFirstLetter(moduleName)}Service;
`
  },
  {
    name: `${moduleName}.model.ts`,
    content: `import mongoose, { Schema } from 'mongoose';

const ${moduleName}Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ${capitalizeFirstLetter(moduleName)}Model = mongoose.model('${capitalizeFirstLetter(moduleName)}', ${moduleName}Schema);
export default ${capitalizeFirstLetter(moduleName)}Model;
`
  },
  {
    name: `${moduleName}.interface.ts`,
    content: `export type ${capitalizeFirstLetter(moduleName)} = {
  _id?: string;
  name: string;
  email: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
`
  },
  {
    name: `${moduleName}.routes.ts`,
    content: `import { RequestHandler, Router } from 'express';
import ${moduleName}Controller from './${moduleName}.controller';

const router = Router();

router.post('/create', ${moduleName}Controller.create as RequestHandler);
router.get('/getAll', ${moduleName}Controller.getAll as RequestHandler);
router.get('/getSingle/:id', ${moduleName}Controller.getById as RequestHandler);
router.put('/update/:id', ${moduleName}Controller.update as RequestHandler);
router.delete('/delete/:id', ${moduleName}Controller.softDelete as RequestHandler);

export default router;
`
  },
];

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
  files.forEach(file => {
    fs.writeFileSync(path.join(basePath, file.name), file.content);
  });
  console.log(`✅ Module '${moduleName}' created successfully.`);
} else {
  console.log(`⚠️ Module '${moduleName}' already exists.`);
}
