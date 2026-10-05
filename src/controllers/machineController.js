import  createMachine  from "../services/machineService.js";

export const MachineCreate = async (req, res) => {
   try{
    const { reference, nom, workshop, status } = req.body;
    if (!reference || !nom || !workshop) {
        return res.status(400).json({ message: 'Reference, nom, and workshop are required' });
    }
    const machine = await createMachine(reference, nom, workshop, status);
    return res.status(201).json({ message: 'Machine created successfully', machine });
   }catch(error){
    console.error('Error creating machine:', error);
    return res.status(500).json({ message: 'Internal server error' });
   }
}
