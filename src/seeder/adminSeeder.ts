// import { userRole } from '../constents';
// import { User } from '../modules/user/user.model';
// import userServices from '../modules/user/user.service';

// const adminSeeder = async () => {
//   const admin = {
//     name: 'Admin',
//     phone: '0000000000',
//     email: 'admin@gmail.com',
//     role: userRole.admin,
//     password: '1',
//     aggriedToTerms: true,
//   };

//   const adminExist = await User.findOne({ role: userRole.admin });

//   if (!adminExist) {
//     console.log('seeding admin....');
//     const createAdmin = await userServices.createUser(admin);
//     if (!createAdmin) {
//       throw Error('admin could not be created');
//     }

//     console.log('Create admin : ', createAdmin);
//   }
// };

// export default adminSeeder;
