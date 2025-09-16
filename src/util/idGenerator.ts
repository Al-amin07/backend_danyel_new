// import { Model, Types} from "mongoose";
// import { QuestionPaperModel } from "../modules/questionPaper/questionPaper.model";

// // Utility function to enforce Document compatibility
// const asDocumentModel = <T>(model: Model<T>): Model<T & Document> => {
//   return model as Model<T & Document>;
// };

// // Utility function to generate IDs for collections

// const collectionIdGenerator = async <T extends Document & { GId: string }>(
//   model: Model<T>,
//   idFor: string,
//   dependency?:string | Types.ObjectId
// ): Promise<string> => {
//   const prefix = idFor.substring(0, 3).toUpperCase();

//   try {
//     let lastRecord

//     if(dependency)
//     {
//       lastRecord = await model.findOne({course_id:dependency}).sort({ createdAt: -1 });
//     }
//     else{
//       lastRecord = await model.findOne().sort({ createdAt: -1 });
//     }
    
//     let newId: string;

//     if (lastRecord) {
//       const lastNumber = parseInt(lastRecord.GId.substring(3), 10);
//       const incrementedNumber = lastNumber + 1;

//       newId = `${prefix}${incrementedNumber.toString().padStart(4, "0")}`;
//     } else {
//       newId = `${prefix}0000`;
//     }

//     return newId;
//   } catch (error: any) {
//     throw new Error(`Error generating ID: ${error.message}`);
//   }
// };





// // ******************* Comment out for deploy




// const mcqIdGenerator = async (QPId: string): Promise<string> => {

//   const splitString = (str:string): string[] => {
//     const match = str.match(/^(QUE\d+)(MCQ\d+)$/);
//     if (match) {
//       return [match[1], match[2].replace("MCQ", "")];
//     }
//     return []; // Return null if the string doesn't match the pattern
//   };

//   const questionPaper = await QuestionPaperModel.findOne({ _id: QPId });
//   if (!questionPaper) {
//     throw new Error("Question Paper not found");
//   }
//   const lastMcqIndex = (questionPaper?.MCQSet.length - 1);
//   const lastMcqId = questionPaper?.MCQSet[lastMcqIndex].mcqId;


//   const mcqId = splitString(lastMcqId)

//   const numberedMcqId = parseInt(mcqId[1]);
//   const mcqSetLength = numberedMcqId + 1;

//   return `${QPId}MCQ${mcqSetLength}`;
// };

// const idGeneratorFunctions = {
//   collectionIdGenerator,
//   mcqIdGenerator,
//   asDocumentModel,
//   // generateId
// };

// export default idGeneratorFunctions;