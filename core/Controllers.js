import InputsController from "../controllers/InputsController.js";
import persianDate      from "persian-date";

class Controllers {
    constructor() {
    }

    static detectPaginationAndSort($input) {
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }
    }

    static item($input, $options = {}, $resultType = 'object') {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await this.model.item($input, $options);

                // create output
                if ($resultType === 'object') {
                    response = await this.outputBuilder(response.toObject());
                }

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error)
            }
        });
    }

    static list($input, $options = {}, $resultType = 'object') {
        return new Promise(async (resolve, reject) => {
            try {
                let list = await this.model.list($input, $options);

                // create output
                if ($resultType === 'object') {
                    for (const row of list) {
                        const index = list.indexOf(row);
                        list[index] = await this.outputBuilder(row.toObject());
                    }
                }

                return resolve({
                    code: 200,
                    data: list
                });
            } catch (error) {
                return reject(error)
            }
        });
    }

    static get($input, $options = {}, $resultType = 'object') {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get from db
                let response = await this.model.get($input._id, $options);

                // create output
                if ($resultType === 'object') {
                    response = await this.outputBuilder(response.toObject());
                }

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // delete from db
                await this.model.deleteOne($input._id);

                // return result
                return resolve({
                    code: 200
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
            }
        }

        return $row;
    }
}

export default Controllers;
