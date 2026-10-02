import Machine from "../models/machine.js";

export const createMachine = async (reference,nom,workshop,status) => {
    const machine= new Machine ({
         reference,
         nom,
         workshop,
         status
       });
    return await machine.save();
}
