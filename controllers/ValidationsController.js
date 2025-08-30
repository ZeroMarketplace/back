import Controllers from "../core/Controllers.js";
import ValidationsModel from "../models/ValidationsModel.js";

class ValidationsController extends Controllers {
  static model = new ValidationsModel();

  constructor() {
    super();
  }

  static insertOne($input) {
    return new Promise((resolve, reject) => {
      // check data is valid ...

      // generate opt code
      // let code = '' + (Math.floor(Math.random() * 9) + 1);
      let code = "11111";
      //   for (let i = 0; i < 4; i++) {
      //     code += Math.floor(Math.random() * 10);
      //   }

      // insert
      this.model
        .insertOne({
          certificate: $input.certificate,
          type: $input.type,
          code: code,
          expDate: new Date(new Date().getTime() + 2 * 60000),
        })
        .then((response) => {
          // check the result ... and return

          return resolve(response);
        })
        .catch((response) => {
          return reject({
            code: 500,
            message:
              "There was a problem registering information, please try again",
          });
        });
    });
  }
}

export default ValidationsController;
