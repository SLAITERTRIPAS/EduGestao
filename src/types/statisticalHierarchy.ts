/**
 * Definições de Tipos para o Sistema Hierárquico Nacional de Estatística Escolar
 * Fluxo: Diretor de Turma -> Pedagógico (1º, 2º, 3º Ciclo) -> Director da Escola -> Distrito -> Província -> Ministério
 */

export type CicloType = '1º Ciclo' | '2º Ciclo' | '3º Ciclo';

export interface ClassStatisticRecord {
  classId: string;
  className: string;
  gradeLevel: string;
  ciclo: CicloType;
  teacherId: string;
  teacherName: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Pendente' | 'Submetido ao Ciclo' | 'Homologado pelo Ciclo';
  submittedAt?: string;
  
  // Dados Demográficos & Aproveitamento
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  
  // Médias e Indicadores
  averageGrade: number;
  attendanceRate: number;
  specialNeedsCount: number;
  
  // Faixas Etárias
  ageGroups: {
    underAge: number;
    officialAge: number;
    overAge: number;
  };
  
  notes?: string;
}

export interface CicloStatisticRecord {
  id: string;
  ciclo: CicloType;
  cicloLabel: string;
  gradesIncluded: string[]; // ex: ['1ª Classe', '2ª Classe', '3ª Classe'] ou ['8ª Classe', '9ª Classe']
  pedagogicalId: string;
  pedagogicalName: string;
  schoolId: string;
  schoolName: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Pendente' | 'Em Análise' | 'Consolidado' | 'Submetido à Direcção';
  submittedAt?: string;
  
  // Agregações
  totalClasses: number;
  submittedClassesCount: number;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  passRate: number;
  averageGrade: number;
  attendanceRate: number;
  
  // Turmas associadas
  classes: ClassStatisticRecord[];
}

export interface SchoolStatisticRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  districtId: string;
  districtName: string;
  provinceId: string;
  provinceName: string;
  directorId: string;
  directorName: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Pendente' | 'Consolidado pela Direcção' | 'Submetido ao Distrito' | 'Validado pelo SDEJT';
  submittedAt?: string;
  signedByDirector: boolean;
  
  // Agregações da Escola
  totalCiclos: number;
  totalClasses: number;
  totalStudents: number;
  totalDocentes: number;
  totalCTA: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  passRate: number;
  averageGrade: number;
  
  // Detalhes por Ciclo
  ciclos: CicloStatisticRecord[];
}

export interface DistrictStatisticRecord {
  id: string;
  districtId: string;
  districtName: string;
  provinceId: string;
  provinceName: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Pendente' | 'Consolidado Distrital' | 'Submetido à Província' | 'Validado pela DPE';
  submittedAt?: string;
  
  // Agregações do Distrito (SDEJT)
  totalSchools: number;
  submittedSchoolsCount: number;
  totalClasses: number;
  totalStudents: number;
  totalDocentes: number;
  totalCTA: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  passRate: number;
  averageGrade: number;
  
  // Escolas do Distrito
  schools: SchoolStatisticRecord[];
}

export interface ProvinceStatisticRecord {
  id: string;
  provinceId: string;
  provinceName: string;
  capital: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Pendente' | 'Consolidado Provincial' | 'Submetido ao Ministério' | 'Homologado pelo MINEDH';
  submittedAt?: string;
  
  // Agregações Provinciais (DPE)
  totalDistricts: number;
  submittedDistrictsCount: number;
  totalSchools: number;
  totalClasses: number;
  totalStudents: number;
  totalDocentes: number;
  totalCTA: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  passRate: number;
  averageGrade: number;
  
  // Distritos da Província
  districts: DistrictStatisticRecord[];
}

export interface NationalStatisticRecord {
  id: string;
  academicYear: number;
  periodo: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | 'Geral';
  status: 'Em Recolha Nacional' | 'Consolidado Nacionalmente' | 'Homologado & Publicado';
  lastUpdatedAt: string;
  
  // Agregação Nacional MINEDH
  totalProvinces: number;
  submittedProvincesCount: number;
  totalDistricts: number;
  totalSchools: number;
  totalClasses: number;
  totalStudents: number;
  totalDocentes: number;
  totalCTA: number;
  maleStudents: number;
  femaleStudents: number;
  approvedCount: number;
  reprovedCount: number;
  droppedCount: number;
  transferredCount: number;
  passRate: number;
  averageGrade: number;
  
  // Províncias Nacionais
  provinces: ProvinceStatisticRecord[];
}
