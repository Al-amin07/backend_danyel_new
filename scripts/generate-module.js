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
    import catchAsync from '../../utils/catchAsync';
    import sendResponse from '../../utils/sendResponse';

    const create = catchAsync(async (req: Request, res: Response) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Service.create(req.body);
      sendResponse(res, {
      statusCode: 201,
      success: true,
      message: '${capitalizeFirstLetter(moduleName)} created successfully',
      data: result,
      });
    });

    const getAll = catchAsync(async (req: Request, res: Response) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Service.getAll();
      sendResponse(res, {
      statusCode: 200,
      success: true,
      message: '${capitalizeFirstLetter(moduleName)}s retrieved successfully',
      data: result,
      });
    });

    const getById = catchAsync(async (req: Request, res: Response) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Service.getById(req.params.id);
      sendResponse(res, {
      statusCode: 200,
      success: true,
      message: '${capitalizeFirstLetter(moduleName)} retrieved successfully',
      data: result,
      });
    });

    const update = catchAsync(async (req: Request, res: Response) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Service.update(req.params.id, req.body);
      sendResponse(res, {
      statusCode: 200,
      success: true,
      message: '${capitalizeFirstLetter(moduleName)} updated successfully',
      data: result,
      });
    });

    const softDelete = catchAsync(async (req: Request, res: Response) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Service.softDelete(req.params.id);
      sendResponse(res, {
      statusCode: 200,
      success: true,
      message: '${capitalizeFirstLetter(moduleName)} soft deleted successfully',
      data: result,
      });
    });

    const ${moduleName}Controller = {
      create,
      getAll,
      getById,
      update,
      softDelete,
    };

    export default ${moduleName}Controller;
`,
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
`,
  },
  {
    name: `${moduleName}.service.ts`,
    content: `import ${capitalizeFirstLetter(moduleName)}Model from './${moduleName}.model';
    import { ${capitalizeFirstLetter(moduleName)} } from './${moduleName}.interface';

    const create = async (data: ${capitalizeFirstLetter(moduleName)}) => {
      const ${moduleName} = await ${capitalizeFirstLetter(moduleName)}Model.create(data);
      return ${moduleName};
    };

    const getAll = async () => {
      const ${moduleName}s = await ${capitalizeFirstLetter(moduleName)}Model.find({ isDeleted: false });
      return ${moduleName}s;
    };

    const getById = async (id: string) => {
      const ${moduleName} = await ${capitalizeFirstLetter(moduleName)}Model.findOne({ _id: id, isDeleted: false });
      return ${moduleName};
    };

    const update = async (id: string, data: Partial<${capitalizeFirstLetter(moduleName)}>) => {
      const ${moduleName} = await ${capitalizeFirstLetter(moduleName)}Model.findOneAndUpdate(
        { _id: id, isDeleted: false },
        data,
        { new: true }
      );
      return ${moduleName};
    };

    const softDelete = async (id: string) => {
      const result = await ${capitalizeFirstLetter(moduleName)}Model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      return result;
    };

    const ${moduleName}Service = {
      create,
      getAll,
      getById,
      update,
      softDelete,
    };

    export default ${moduleName}Service;
`,
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
`,
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
`,
  },
  {
    name: `${moduleName}.routes.ts`,
    content: `import { Router } from 'express';
    import ${moduleName}Controller from './${moduleName}.controller';

    const router = Router();

    router.post('/create', ${moduleName}Controller.create);
    router.get('/getAll', ${moduleName}Controller.getAll);
    router.get('/getSingle/:id', ${moduleName}Controller.getById);
    router.put('/update/:id', ${moduleName}Controller.update);
    router.delete('/delete/:id', ${moduleName}Controller.softDelete);

    export default router;
`,
  },
];

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
  files.forEach((file) => {
    fs.writeFileSync(path.join(basePath, file.name), file.content);
  });
  console.log(`✅ Module '${moduleName}' created successfully.`);
} else {
  console.log(`⚠️ Module '${moduleName}' already exists.`);
}
