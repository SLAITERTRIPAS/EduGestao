/**
 * SIGE - Sistema Integrado de Gestão Escolar (MINEDH)
 * Módulo de Perfis & Funcionalidades (Organização Arquitetural)
 *
 * Perfis Oficiais do Sistema:
 * 1. Administrador Geral (TI & Infraestrutura - Sem Assinatura Digital)
 * 2. Direção da Escola
 * 3. Direção Adjunta Pedagógica (1º Ciclo, 2º Ciclo ESG1 e ESG2)
 * 4. Secretaria Escolar & Técnicos Administrativos
 * 5. Gestão Financeira & Tesouraria
 * 6. Governação da Educação (Ministério, Província e Distrito)
 * 7. Corpo Docente / Professores
 * 8. Corpo Discente / Alunos
 * 9. Encarregados de Educação
 */

export * from './admin';
export * from './admin/profileManifest';

export * from './director';
export * from './director/profileManifest';

export * from './pedagogical';
export * from './pedagogical/profileManifest';

export * from './secretariat';
export * from './secretariat/profileManifest';

export * from './financial';
export * from './financial/profileManifest';

export * from './governance';
export * from './governance/profileManifest';

export * from './teacher';
export * from './teacher/profileManifest';

export * from './student';
export * from './student/profileManifest';

export * from './guardian';
export * from './guardian/profileManifest';

import { ADMIN_PROFILE_MANIFEST } from './admin/profileManifest';
import { DIRECTOR_PROFILE_MANIFEST } from './director/profileManifest';
import { PEDAGOGICAL_PROFILE_MANIFEST } from './pedagogical/profileManifest';
import { SECRETARIAT_PROFILE_MANIFEST } from './secretariat/profileManifest';
import { FINANCIAL_PROFILE_MANIFEST } from './financial/profileManifest';
import { GOVERNANCE_PROFILE_MANIFEST } from './governance/profileManifest';
import { TEACHER_PROFILE_MANIFEST } from './teacher/profileManifest';
import { STUDENT_PROFILE_MANIFEST } from './student/profileManifest';
import { GUARDIAN_PROFILE_MANIFEST } from './guardian/profileManifest';

export const ALL_PROFILES_MANIFESTS = [
  ADMIN_PROFILE_MANIFEST,
  DIRECTOR_PROFILE_MANIFEST,
  PEDAGOGICAL_PROFILE_MANIFEST,
  SECRETARIAT_PROFILE_MANIFEST,
  FINANCIAL_PROFILE_MANIFEST,
  GOVERNANCE_PROFILE_MANIFEST,
  TEACHER_PROFILE_MANIFEST,
  STUDENT_PROFILE_MANIFEST,
  GUARDIAN_PROFILE_MANIFEST
];
