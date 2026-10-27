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

const app = express();

app.use(express.json());

const samplesVacancies = [
    {id: 1, title: 'Desarrollador Backend', company:'Tech Ander', modality: 'remoto', salary: 800},
    {id: 2, title: 'Analista de Datos', company:'DataSur', modality: 'híbrido', salary: 1200},
];

//Repositorio: Guardando las vacantes
const vacancyRepository: VacancyRepository = process.env.DATABASE_URL
    ? new PostgresVacancyRepository(createPostgresPool(process.env.DATABASE_URL))
    : new InMemoryVacancyRepository(samplesVacancies);
console.log(`Vacancies persistences: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In memory'}`);


//2) Servicio (casos de uso)
const vancacyService = new VancacyService(vacancyRepository);
const companyRepository = new CompanyService(new InMemoryCompanyRepository());

//3) Rutas: se le entrega el servicio y se monta bajo el prefijo /vacancies
app.use('/vacancies', createVacancyRouter(vancacyService));
app.use('/companies', createCompanyRouter(companyRepository));

app.use(notFoundHandler);

app.use(errorHandler);

export default app;