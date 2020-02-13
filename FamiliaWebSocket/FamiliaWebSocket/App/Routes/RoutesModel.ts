export interface MedicineModel {
    idClient: number;
    idPersAsisoc: number;
    data: Array<DiseaseModel>;
}

interface DiseaseModel {
    boala: string;
    medicamente: Array<DrugModel>;
}

interface DrugModel {
    denumire: string;
    dataStart: string;
    dataStop: string;
    ore: Array<Hour>;
    postpone: number;
    idMedAsisoc: number;
}

interface Hour {
    ora: string;
}
