import express from 'express';

import { InMemoryVacancyRepository } from './modules/vacancies/adapters/persistence/InMemoryVacancyRepository';
import { VancacyService } from './modules/vacancies/application/VacancyService';
import { createVacancyRouter } from './modules/vacancies/adapters/http/vacancyRoutes';
import { errorHandler, notFoundHandler } from './shared/httpErrorHandlers';
import { PostgresVacancyRepository } from './modules/vacancies/adapters/persistence/PostgresVacancyRepository';
import { VacancyRepository } from './modules/vacancies/ports/VacancyRepository';
import { createPostgresPool } from './shared/database/postgresPool';
import { createCompanyRouter } from './modules/companies/adapters/http/companyRoutes';
import { InMemoryCompanyRepository } from './modules/companies/adapters/persistence/InMemoryCompanyRepository';
import { CompanyService } from './modules/companies/application/CompanyService';
import { CompanyRepository } from './modules/companies/ports/CompanyRepository';
import { MongoCompanyRepository } from './modules/companies/adapters/persistence/MongoCompanyRepository';
import { createMongoClient } from './shared/database/mongoClient';
import { PrismaVacancyRepository } from './modules/vacancies/adapters/persistence/PrismaVacancyRepository';
import { createPrismaClient } from './shared/database/prismaClient';

const app = express();

app.use(express.json());

const samplesVacancies = [
    {id: 1, title: 'Desarrollador Backend', company:'Tech Ander', modality: 'remoto', salary: 800},
    {id: 2, title: 'Analista de Datos', company:'DataSur', modality: 'híbrido', salary: 1200},
];

//Elige el repositorio de vancantes según las variables de entorno .evn
const createVacancyRepository = (): {name: string; repository: VacancyRepository} => {
    const databaseUrl = process.env.DATABASE_URL;

    //Sin DATABASE_URL -> lista en memoria
    if(!databaseUrl){
        return {name: 'in memory', repository: new InMemoryVacancyRepository(samplesVacancies)};
    }

    // Con VACANACIES_ADAPTER = prisma: PostgreSQL a través de Prisma
    if(process.env.VACANCIES_ADAPTER === 'prisma'){
        return {name: 'PostgreSQL with Prisma', repository: new PrismaVacancyRepository(createPrismaClient(databaseUrl)),};
    }

    //Por defecto: PostgreSQL puro
    return { name: 'PostgreSQL with pg', repository: new PostgresVacancyRepository(createPostgresPool(databaseUrl)),};
}

const {name: vacanciesAdapterName, repository: vacancyRepository} = createVacancyRepository();
console.log(`Vacancies persistence: ${vacanciesAdapterName}`);

//Repositorio: Guardar las companias
const companyRepository: CompanyRepository = process.env.MONGODB_URI
    ? new MongoCompanyRepository(createMongoClient(process.env.MONGODB_URI))
    : new InMemoryCompanyRepository();
console.log(`Companies persistences: ${process.env.MONGODB_URI ? 'MongoDB' : 'In memory'}`);

//2) Servicio (casos de uso)
const vancacyService = new VancacyService(vacancyRepository);
const companyService = new CompanyService(companyRepository);

//3) Rutas: se le entrega el servicio y se monta bajo el prefijo /vacancies
app.use('/vacancies', createVacancyRouter(vancacyService));
app.use('/companies', createCompanyRouter(companyService));

app.use(notFoundHandler);

app.use(errorHandler);

export default app;