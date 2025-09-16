import { TErrorSource } from '../constents';

const dublicateErrorHandellerr = (err: any) => {
  const match = err.errorResponse.errmsg.match(/"([^"]*)"/);
  const errorMessage = match ? match[1] : 'No match found';

  const statuscode = 400;
  const message = `Dublicet entry error : ${errorMessage} already exist`;
  console.log({ errorMessage, err });
  const errorSource: TErrorSource = [
    {
      path: '',
      message: `${errorMessage} already exist`,
    },
  ];
  return {
    statuscode,
    message,
    errorSource,
  };
};

export default dublicateErrorHandellerr;
