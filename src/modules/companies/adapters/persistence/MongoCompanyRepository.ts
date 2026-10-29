import { MongoClient, ObjectId, WithId } from "mongodb";

import { Company, NewCompany } from '../../domain/Company';
import { CompanyRepository } from "../../ports/CompanyRepository";

//ObjectId válido: 24 caracteres hexadecimales.
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

//Mapeo - convierte un documento de MongoDB en una Company del dominio.
const toCompany = ({_id, ...data}: WithId<NewCompany>): Company => ({id: _id.toHexString(), ...data});

//Adaptador de salida - cumple el mismo contrato que el repositorio en memoria.
export class MongoCompanyRepository implements CompanyRepository {

    //La collección "companies" 
    private readonly collection;

    constructor(client: MongoClient){
        this.collection = client.db().collection<NewCompany>('companies');
    }

    findAll = async () : Promise<Company[]> => {
        const documents = await this.collection.find().toArray();
        return documents.map(toCompany);
    }

    findById = async (id: string) : Promise<Company | undefined> =>{
        if(!OBJECT_ID_PATTERN.test(id)){
            return undefined;
        }
        const document = await this.collection.findOne({_id: new ObjectId(id)});
        return document ? toCompany(document) : undefined;
    }

    save = async (newCompany: NewCompany): Promise<Company> =>{
      const result = await this.collection.insertOne({...newCompany});
      return {id: result.insertedId.toHexString(), ...newCompany};
    };
}