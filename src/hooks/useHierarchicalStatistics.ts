import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { 
  CicloType,
  ClassStatisticRecord,
  CicloStatisticRecord,
  SchoolStatisticRecord,
  DistrictStatisticRecord,
  ProvinceStatisticRecord,
  NationalStatisticRecord
} from '../types/statisticalHierarchy';
import { MOZAMBIQUE_PROVINCES } from '../data/mozambiqueLocations';

const STORAGE_KEY = 'SIGE_HIERARCHICAL_STATISTICS_V4';

// Helper to determine ciclo from grade level
export function getCicloFromGrade(gradeLevel: string): CicloType {
  const g = gradeLevel.toLowerCase();
  if (g.includes('1ª') || g.includes('2ª') || g.includes('3ª') || g.includes('4ª') || g.includes('5ª') || g.includes('8ª')) {
    return '1º Ciclo';
  }
  if (g.includes('6ª') || g.includes('7ª') || g.includes('9ª') || g.includes('10ª')) {
    return '2º Ciclo';
  }
  return '3º Ciclo';
}

export function getCicloGrades(ciclo: CicloType): string[] {
  switch (ciclo) {
    case '1º Ciclo':
      return ['1ª Classe', '2ª Classe', '3ª Classe', '8ª Classe'];
    case '2º Ciclo':
      return ['4ª Classe', '5ª Classe', '6ª Classe', '9ª Classe', '10ª Classe'];
    case '3º Ciclo':
      return ['7ª Classe', '11ª Classe', '12ª Classe'];
  }
}

export function useHierarchicalStatistics() {
  const { classes, students, employees, currentUser, schools, addArchiveRecord } = useStore();
  const currentYear = 2026;

  // Initial State Generator
  const generateInitialData = useCallback((): NationalStatisticRecord => {
    const currentSchool = schools[0] || {
      id: 's1',
      name: 'Escola Secundária Central de Maputo',
      code: 'ESC-MP-001',
      districtId: 'd1',
      districtName: 'KaMpfumo',
      provinceId: 'p1',
      provinceName: 'Cidade de Maputo'
    };

    // 1. Generate Class Statistic Records for the current active school
    const classRecords: ClassStatisticRecord[] = classes.map((cls, idx) => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const totalStudents = clsStudents.length > 0 ? clsStudents.length : 32 + (idx * 3);
      const maleStudents = clsStudents.length > 0 
        ? clsStudents.filter(s => s.gender === 'M').length 
        : Math.round(totalStudents * 0.48);
      const femaleStudents = totalStudents - maleStudents;
      
      const ciclo = getCicloFromGrade(cls.gradeLevel);
      const approvedCount = Math.round(totalStudents * (0.78 + (idx % 3) * 0.05));
      const reprovedCount = Math.round(totalStudents * 0.12);
      const droppedCount = Math.max(0, totalStudents - approvedCount - reprovedCount - 1);
      const transferredCount = totalStudents - approvedCount - reprovedCount - droppedCount;

      // Status default: algumas já submetidas, outras prontas para demonstrar
      const isInitialSubmitted = idx % 2 === 0;

      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        ciclo,
        teacherId: `prof-${idx + 1}`,
        teacherName: `Professor Director ${cls.name}`,
        academicYear: currentYear,
        periodo: '1º Trimestre',
        status: isInitialSubmitted ? 'Submetido ao Ciclo' : 'Pendente',
        submittedAt: isInitialSubmitted ? '2026-03-15 10:30' : undefined,
        totalStudents,
        maleStudents,
        femaleStudents,
        approvedCount,
        reprovedCount,
        droppedCount,
        transferredCount,
        averageGrade: Math.round((12.4 + (idx % 4) * 0.8) * 10) / 10,
        attendanceRate: Math.round((92 + (idx % 5)) * 10) / 10,
        specialNeedsCount: idx % 3 === 0 ? 1 : 0,
        ageGroups: {
          underAge: Math.round(totalStudents * 0.08),
          officialAge: Math.round(totalStudents * 0.82),
          overAge: Math.round(totalStudents * 0.10)
        }
      };
    });

    // 2. Generate 3 Ciclos Records (1º Ciclo, 2º Ciclo, 3º Ciclo)
    const ciclosTypes: CicloType[] = ['1º Ciclo', '2º Ciclo', '3º Ciclo'];
    const cicloRecords: CicloStatisticRecord[] = ciclosTypes.map((ciclo, idx) => {
      const cicloClasses = classRecords.filter(c => c.ciclo === ciclo);
      const totalClasses = cicloClasses.length;
      const submittedClassesCount = cicloClasses.filter(c => c.status === 'Submetido ao Ciclo' || c.status === 'Homologado pelo Ciclo').length;
      
      const totalStudents = cicloClasses.reduce((acc, c) => acc + c.totalStudents, 0);
      const maleStudents = cicloClasses.reduce((acc, c) => acc + c.maleStudents, 0);
      const femaleStudents = cicloClasses.reduce((acc, c) => acc + c.femaleStudents, 0);
      const approvedCount = cicloClasses.reduce((acc, c) => acc + c.approvedCount, 0);
      const reprovedCount = cicloClasses.reduce((acc, c) => acc + c.reprovedCount, 0);
      const droppedCount = cicloClasses.reduce((acc, c) => acc + c.droppedCount, 0);
      const transferredCount = cicloClasses.reduce((acc, c) => acc + c.transferredCount, 0);
      const passRate = totalStudents > 0 ? Math.round((approvedCount / totalStudents) * 1000) / 10 : 0;
      const averageGrade = cicloClasses.length > 0 ? Math.round((cicloClasses.reduce((a, c) => a + c.averageGrade, 0) / cicloClasses.length) * 10) / 10 : 13.0;
      const attendanceRate = cicloClasses.length > 0 ? Math.round((cicloClasses.reduce((a, c) => a + c.attendanceRate, 0) / cicloClasses.length) * 10) / 10 : 93.5;

      const pedagogicalNames = [
        'Dr. Sérgio Cossa (DAP 1º Ciclo)',
        'Dra. Ana Maria Sitoe (DAP 2º Ciclo)',
        'Prof. Manuel Mondlane (DAP 3º Ciclo)'
      ];

      return {
        id: `ciclo-${idx + 1}`,
        ciclo,
        cicloLabel: `${ciclo} • ${ciclo === '1º Ciclo' ? 'Iniciação & Básico' : ciclo === '2º Ciclo' ? 'Intermédio & Transição' : 'Conclusão & Pré-Universitário'}`,
        gradesIncluded: getCicloGrades(ciclo),
        pedagogicalId: `dap-${idx + 1}`,
        pedagogicalName: pedagogicalNames[idx],
        schoolId: currentSchool.id,
        schoolName: currentSchool.name,
        academicYear: currentYear,
        periodo: '1º Trimestre',
        status: idx === 0 ? 'Submetido à Direcção' : 'Pendente',
        submittedAt: idx === 0 ? '2026-03-18 14:15' : undefined,
        totalClasses,
        submittedClassesCount,
        totalStudents,
        maleStudents,
        femaleStudents,
        approvedCount,
        reprovedCount,
        droppedCount,
        transferredCount,
        passRate,
        averageGrade,
        attendanceRate,
        classes: cicloClasses
      };
    });

    // 3. School Record
    const totalSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.totalStudents, 0);
    const maleSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.maleStudents, 0);
    const femaleSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.femaleStudents, 0);
    const approvedSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.approvedCount, 0);
    const reprovedSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.reprovedCount, 0);
    const droppedSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.droppedCount, 0);
    const transferredSchoolStudents = cicloRecords.reduce((acc, c) => acc + c.transferredCount, 0);
    const schoolPassRate = totalSchoolStudents > 0 ? Math.round((approvedSchoolStudents / totalSchoolStudents) * 1000) / 10 : 0;
    const schoolAvgGrade = Math.round((cicloRecords.reduce((a, c) => a + c.averageGrade, 0) / (cicloRecords.length || 1)) * 10) / 10;

    const schoolRecord: SchoolStatisticRecord = {
      id: currentSchool.id,
      schoolId: currentSchool.id,
      schoolName: currentSchool.name,
      schoolCode: (currentSchool as any).code || 'ESC-001',
      districtId: currentSchool.districtId || 'd1',
      districtName: (currentSchool as any).districtName || 'KaMpfumo',
      provinceId: currentSchool.provinceId || 'p1',
      provinceName: (currentSchool as any).provinceName || 'Cidade de Maputo',
      directorId: 'dir-1',
      directorName: 'Dr. Armando Sitoe',
      academicYear: currentYear,
      periodo: '1º Trimestre',
      status: 'Pendente',
      signedByDirector: false,
      totalCiclos: 3,
      totalClasses: classRecords.length,
      totalStudents: totalSchoolStudents,
      totalDocentes: employees.filter(e => e.career === 'Docente').length || 42,
      totalCTA: employees.filter(e => e.career !== 'Docente').length || 18,
      maleStudents: maleSchoolStudents,
      femaleStudents: femaleSchoolStudents,
      approvedCount: approvedSchoolStudents,
      reprovedCount: reprovedSchoolStudents,
      droppedCount: droppedSchoolStudents,
      transferredCount: transferredSchoolStudents,
      passRate: schoolPassRate,
      averageGrade: schoolAvgGrade,
      ciclos: cicloRecords
    };

    // Helper: generate authentic district schools
    const createDistrictSchools = (
      dId: string, 
      dName: string, 
      pId: string, 
      pName: string,
      customSchoolNames: string[]
    ): SchoolStatisticRecord[] => {
      const generated: SchoolStatisticRecord[] = [];
      
      // If this is KaMpfumo, ensure primary schoolRecord is first
      if (dName.toLowerCase().includes('kampfumo') || dName.toLowerCase().includes('kamphemo')) {
        generated.push(schoolRecord);
      }

      customSchoolNames.forEach((sName, sIdx) => {
        if (generated.some(s => s.schoolName.toLowerCase() === sName.toLowerCase())) return;

        const baseStudents = 1100 + ((sIdx * 340) % 2100);
        const pRate = 72 + ((sIdx * 5) % 23) + ((sIdx % 2) * 0.4);
        const male = Math.round(baseStudents * (0.47 + ((sIdx % 4) * 0.015)));
        const female = baseStudents - male;
        const approved = Math.round((baseStudents * pRate) / 100);
        const reproved = Math.round(baseStudents * (0.11 + ((sIdx % 3) * 0.02)));
        const dropped = Math.max(0, baseStudents - approved - reproved);
        const transferred = Math.round(baseStudents * 0.02);
        const classesCount = Math.max(14, Math.round(baseStudents / 42));
        const docentesCount = Math.max(22, Math.round(baseStudents / 33));
        const ctaCount = Math.max(7, Math.round(docentesCount * 0.32));
        const avgGrade = Math.round((11.8 + ((sIdx % 5) * 0.6)) * 10) / 10;

        generated.push({
          id: `sch-${dId}-${sIdx + 1}`,
          schoolId: `sch-${dId}-${sIdx + 1}`,
          schoolName: sName,
          schoolCode: `ESC-${dName.slice(0, 3).toUpperCase()}-${String(sIdx + 1).padStart(3, '0')}`,
          districtId: dId,
          districtName: dName,
          provinceId: pId,
          provinceName: pName,
          directorId: `dir-${dId}-${sIdx + 1}`,
          directorName: `Prof. Dr. ${sName.replace('Escola ', '').replace('Secundária ', '').replace('Primária Completa ', '')} Nhaca`,
          academicYear: currentYear,
          periodo: '1º Trimestre',
          status: sIdx % 3 === 0 ? 'Validado pelo SDEJT' : sIdx % 3 === 1 ? 'Submetido ao Distrito' : 'Consolidado pela Direcção',
          signedByDirector: sIdx % 2 === 0,
          totalCiclos: 3,
          totalClasses: classesCount,
          totalStudents: baseStudents,
          totalDocentes: docentesCount,
          totalCTA: ctaCount,
          maleStudents: male,
          femaleStudents: female,
          approvedCount: approved,
          reprovedCount: reproved,
          droppedCount: dropped,
          transferredCount: transferred,
          passRate: Math.round(pRate * 10) / 10,
          averageGrade: avgGrade,
          ciclos: []
        });
      });

      return generated;
    };

    // Pre-defined school names for major districts
    const getSchoolsForDistrictName = (dName: string, pName: string): string[] => {
      const dn = dName.toLowerCase();
      if (dn.includes('kampfumo')) {
        return [
          'Escola Secundária Josina Machel',
          'Escola Secundária Francisco Manyanga',
          'Escola Primária Completa 7 de Abril',
          'Escola Primária Completa 3 de Fevereiro',
          'Instituto Comercial de Maputo',
          'Escola Secundária Estrela Vermelha',
          'EPC Alto Maé'
        ];
      }
      if (dn.includes('nlhamankulu')) {
        return [
          'Escola Primária Completa Unidade 7',
          'Escola Secundária de Lhanguene',
          'EPC Chamanculo A',
          'EPC Malangalene',
          'Escola Básica de Munhuana',
          'EPC 25 de Junho B'
        ];
      }
      if (dn.includes('kamaxakeni')) {
        return [
          'Escola Secundária da Polana',
          'Escola Secundária Noroeste 1',
          'EPC Maxaquene',
          'EPC Sommerschield',
          'EPC Central KaMaxakeni'
        ];
      }
      if (dn.includes('kamavota')) {
        return [
          'Escola Secundária de Laulane',
          'Escola Secundária das FPLM',
          'EPC Albasine',
          'EPC Mavalane',
          'EPC Hulene'
        ];
      }
      if (dn.includes('kamubukwana')) {
        return [
          'Escola Secundária de Bagamoyo',
          'EPC 25 de Junho',
          'EPC George Dimitrov',
          'EPC Luís Cabral'
        ];
      }
      if (dn.includes('katembe') || dn.includes('catembe')) {
        return [
          'Escola Secundária da Katembe',
          'EPC Chali',
          'EPC Incassane',
          'EPC Guachene'
        ];
      }
      if (dn.includes('kanyaka') || dn.includes('inhaca')) {
        return [
          'Escola Secundária da Inhaca',
          'EPC Ribjene',
          'EPC Inhaca Sede'
        ];
      }
      if (dn.includes('matola')) {
        return [
          'Instituto Técnico Profissional da Matola',
          'Escola Secundária da Matola',
          'Escola Secundária Força do Povo',
          'EPC Liberdade',
          'EPC Fomento',
          'EPC Machava Sede'
        ];
      }
      // Generic authentic school network for any other district
      return [
        `Escola Secundária de ${dName}`,
        `Escola Primária Completa Central de ${dName}`,
        `Escola Básica e Secundária ${dName} Sede`,
        `Instituto Técnico Vocacional de ${dName}`,
        `Escola Primária Completa ${dName} B`
      ];
    };

    // 4. Generate All 11 Provinces with All Their Districts and All Their District Schools
    const allProvinces: ProvinceStatisticRecord[] = MOZAMBIQUE_PROVINCES.map((prov, pIdx) => {
      const provName = prov.province;
      const provId = `p-${pIdx + 1}`;

      const districtsList: DistrictStatisticRecord[] = prov.districts.map((dName, dIdx) => {
        const dId = `dist-${provName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${dIdx + 1}`;
        const schoolNames = getSchoolsForDistrictName(dName, provName);
        const districtSchools = createDistrictSchools(dId, dName, provId, provName, schoolNames);

        const dTotalStudents = districtSchools.reduce((a, s) => a + s.totalStudents, 0);
        const dMale = districtSchools.reduce((a, s) => a + s.maleStudents, 0);
        const dFemale = districtSchools.reduce((a, s) => a + s.femaleStudents, 0);
        const dApproved = districtSchools.reduce((a, s) => a + s.approvedCount, 0);
        const dReproved = districtSchools.reduce((a, s) => a + s.reprovedCount, 0);
        const dDropped = districtSchools.reduce((a, s) => a + s.droppedCount, 0);
        const dTransf = districtSchools.reduce((a, s) => a + s.transferredCount, 0);
        const dClasses = districtSchools.reduce((a, s) => a + s.totalClasses, 0);
        const dDocentes = districtSchools.reduce((a, s) => a + s.totalDocentes, 0);
        const dCTA = districtSchools.reduce((a, s) => a + s.totalCTA, 0);
        const dPassRate = dTotalStudents > 0 ? Math.round((dApproved / dTotalStudents) * 1000) / 10 : 81.5;
        const dAvgGrade = Math.round((districtSchools.reduce((a, s) => a + s.averageGrade, 0) / (districtSchools.length || 1)) * 10) / 10;

        return {
          id: dId,
          districtId: dId,
          districtName: dName,
          provinceId: provId,
          provinceName: provName,
          academicYear: currentYear,
          periodo: '1º Trimestre',
          status: (dIdx + pIdx) % 2 === 0 ? 'Validado pela DPE' : 'Submetido à Província',
          submittedAt: `2026-03-${18 + (dIdx % 10)} 10:30`,
          totalSchools: districtSchools.length,
          submittedSchoolsCount: districtSchools.filter(s => s.status === 'Validado pelo SDEJT' || s.status === 'Submetido ao Distrito').length,
          totalClasses: dClasses,
          totalStudents: dTotalStudents,
          totalDocentes: dDocentes,
          totalCTA: dCTA,
          maleStudents: dMale,
          femaleStudents: dFemale,
          approvedCount: dApproved,
          reprovedCount: dReproved,
          droppedCount: dDropped,
          transferredCount: dTransf,
          passRate: dPassRate,
          averageGrade: dAvgGrade,
          schools: districtSchools
        };
      });

      const pTotalStudents = districtsList.reduce((a, d) => a + d.totalStudents, 0);
      const pMale = districtsList.reduce((a, d) => a + d.maleStudents, 0);
      const pFemale = districtsList.reduce((a, d) => a + d.femaleStudents, 0);
      const pApproved = districtsList.reduce((a, d) => a + d.approvedCount, 0);
      const pReproved = districtsList.reduce((a, d) => a + d.reprovedCount, 0);
      const pDropped = districtsList.reduce((a, d) => a + d.droppedCount, 0);
      const pTransf = districtsList.reduce((a, d) => a + d.transferredCount, 0);
      const pSchools = districtsList.reduce((a, d) => a + d.totalSchools, 0);
      const pClasses = districtsList.reduce((a, d) => a + d.totalClasses, 0);
      const pDocentes = districtsList.reduce((a, d) => a + d.totalDocentes, 0);
      const pCTA = districtsList.reduce((a, d) => a + d.totalCTA, 0);
      const pPassRate = pTotalStudents > 0 ? Math.round((pApproved / pTotalStudents) * 1000) / 10 : 81.0;
      const pAvgGrade = Math.round((districtsList.reduce((a, d) => a + d.averageGrade, 0) / (districtsList.length || 1)) * 10) / 10;

      return {
        id: `prov-${provName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        provinceId: provId,
        provinceName: provName,
        capital: prov.districts[0] || provName,
        academicYear: currentYear,
        periodo: '1º Trimestre',
        status: pIdx < 7 ? 'Submetido ao Ministério' : 'Pendente',
        submittedAt: pIdx < 7 ? `2026-03-${20 + (pIdx % 4)} 09:00` : undefined,
        totalDistricts: districtsList.length,
        submittedDistrictsCount: districtsList.filter(d => d.status === 'Validado pela DPE' || d.status === 'Submetido à Província').length,
        totalSchools: pSchools,
        totalClasses: pClasses,
        totalStudents: pTotalStudents,
        totalDocentes: pDocentes,
        totalCTA: pCTA,
        maleStudents: pMale,
        femaleStudents: pFemale,
        approvedCount: pApproved,
        reprovedCount: pReproved,
        droppedCount: pDropped,
        transferredCount: pTransf,
        passRate: pPassRate,
        averageGrade: pAvgGrade,
        districts: districtsList
      };
    });

    // 7. National Summary MINEDH
    const nationalTotalStudents = allProvinces.reduce((acc, p) => acc + p.totalStudents, 0);
    const nationalMale = allProvinces.reduce((acc, p) => acc + p.maleStudents, 0);
    const nationalFemale = allProvinces.reduce((acc, p) => acc + p.femaleStudents, 0);
    const nationalApproved = allProvinces.reduce((acc, p) => acc + p.approvedCount, 0);
    const nationalReproved = allProvinces.reduce((acc, p) => acc + p.reprovedCount, 0);
    const nationalDropped = allProvinces.reduce((acc, p) => acc + p.droppedCount, 0);
    const nationalTransferred = allProvinces.reduce((acc, p) => acc + p.transferredCount, 0);
    const nationalPassRate = Math.round((nationalApproved / nationalTotalStudents) * 1000) / 10;
    const nationalAvgGrade = Math.round((allProvinces.reduce((acc, p) => acc + p.averageGrade, 0) / allProvinces.length) * 10) / 10;

    return {
      id: 'minedh-nacional-2026',
      academicYear: currentYear,
      periodo: '1º Trimestre',
      status: 'Em Recolha Nacional',
      lastUpdatedAt: new Date().toISOString(),
      totalProvinces: 11,
      submittedProvincesCount: allProvinces.filter(p => p.status === 'Submetido ao Ministério' || p.status === 'Homologado pelo MINEDH').length,
      totalDistricts: allProvinces.reduce((acc, p) => acc + p.totalDistricts, 0),
      totalSchools: allProvinces.reduce((acc, p) => acc + p.totalSchools, 0),
      totalClasses: allProvinces.reduce((acc, p) => acc + p.totalClasses, 0),
      totalStudents: nationalTotalStudents,
      totalDocentes: allProvinces.reduce((acc, p) => acc + p.totalDocentes, 0),
      totalCTA: allProvinces.reduce((acc, p) => acc + p.totalCTA, 0),
      maleStudents: nationalMale,
      femaleStudents: nationalFemale,
      approvedCount: nationalApproved,
      reprovedCount: nationalReproved,
      droppedCount: nationalDropped,
      transferredCount: nationalTransferred,
      passRate: nationalPassRate,
      averageGrade: nationalAvgGrade,
      provinces: allProvinces
    };
  }, [classes, students, employees, schools, currentYear]);

  // Load state from local storage or generate fresh
  const [nationalData, setNationalData] = useState<NationalStatisticRecord>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read hierarchical statistics from localStorage', e);
    }
    return generateInitialData();
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nationalData));
    } catch (e) {
      console.warn('Could not save hierarchical statistics to localStorage', e);
    }
  }, [nationalData]);

  // Selections for hierarchical drill-down
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('Cidade de Maputo');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('KaMpfumo');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('s1');

  // Currently Selected Province
  const currentProvince = useMemo(() => {
    return nationalData.provinces.find(p => p.provinceName.toLowerCase() === selectedProvinceName.toLowerCase()) 
      || nationalData.provinces[0];
  }, [nationalData, selectedProvinceName]);

  // Currently Selected District inside selected Province
  const currentDistrict = useMemo(() => {
    if (!currentProvince || !currentProvince.districts?.length) return undefined;
    return currentProvince.districts.find(d => 
      d.districtName.toLowerCase().includes(selectedDistrictName.toLowerCase()) || 
      selectedDistrictName.toLowerCase().includes(d.districtName.toLowerCase())
    ) || currentProvince.districts[0];
  }, [currentProvince, selectedDistrictName]);

  // Active School Shortcut
  const activeSchool = useMemo(() => {
    if (currentDistrict?.schools?.length) {
      const match = currentDistrict.schools.find(s => s.id === selectedSchoolId || s.schoolId === selectedSchoolId);
      if (match) return match;
    }
    const maputoProv = nationalData.provinces.find(p => p.provinceName === 'Cidade de Maputo');
    const district = maputoProv?.districts[0];
    return district?.schools[0] || null;
  }, [nationalData, currentDistrict, selectedSchoolId]);

  // =========================================================================
  // ACTIONS / WORKFLOW METHODS
  // =========================================================================

  /**
   * 1. DIRETOR DE TURMA: Submete estatística da sua turma para o respectivo ciclo
   */
  const submitClassToCiclo = useCallback((classId: string, customNotes?: string) => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      const prov = copy.provinces.find(p => p.provinceName === 'Cidade de Maputo');
      if (!prov || !prov.districts[0]?.schools[0]) return prev;

      const school = prov.districts[0].schools[0];
      let targetCiclo: CicloStatisticRecord | undefined;
      let targetClass: ClassStatisticRecord | undefined;

      for (const ciclo of school.ciclos) {
        const cls = ciclo.classes.find(c => c.classId === classId);
        if (cls) {
          targetCiclo = ciclo;
          targetClass = cls;
          break;
        }
      }

      if (!targetClass || !targetCiclo) return prev;

      // Update class status
      targetClass.status = 'Submetido ao Ciclo';
      targetClass.submittedAt = new Date().toLocaleString('pt-MZ');
      if (customNotes) targetClass.notes = customNotes;

      // Recalculate ciclo counts
      targetCiclo.submittedClassesCount = targetCiclo.classes.filter(c => c.status === 'Submetido ao Ciclo' || c.status === 'Homologado pelo Ciclo').length;

      return copy;
    });
  }, []);

  /**
   * 2. PEDAGÓGICO DE CICLO (1º, 2º ou 3º): Transforma estatísticas das turmas em Estatística do Ciclo e submete à Direcção
   */
  const consolidateAndSubmitCicloToSchool = useCallback((cicloType: CicloType) => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      const prov = copy.provinces.find(p => p.provinceName === 'Cidade de Maputo');
      if (!prov || !prov.districts[0]?.schools[0]) return prev;

      const school = prov.districts[0].schools[0];
      const targetCiclo = school.ciclos.find(c => c.ciclo === cicloType);
      if (!targetCiclo) return prev;

      // Mark all classes as homologated
      targetCiclo.classes.forEach(c => {
        c.status = 'Homologado pelo Ciclo';
      });

      // Recalculate aggregates from classes
      targetCiclo.totalStudents = targetCiclo.classes.reduce((acc, c) => acc + c.totalStudents, 0);
      targetCiclo.maleStudents = targetCiclo.classes.reduce((acc, c) => acc + c.maleStudents, 0);
      targetCiclo.femaleStudents = targetCiclo.classes.reduce((acc, c) => acc + c.femaleStudents, 0);
      targetCiclo.approvedCount = targetCiclo.classes.reduce((acc, c) => acc + c.approvedCount, 0);
      targetCiclo.reprovedCount = targetCiclo.classes.reduce((acc, c) => acc + c.reprovedCount, 0);
      targetCiclo.droppedCount = targetCiclo.classes.reduce((acc, c) => acc + c.droppedCount, 0);
      targetCiclo.transferredCount = targetCiclo.classes.reduce((acc, c) => acc + c.transferredCount, 0);
      targetCiclo.passRate = targetCiclo.totalStudents > 0 
        ? Math.round((targetCiclo.approvedCount / targetCiclo.totalStudents) * 1000) / 10 
        : 0;
      targetCiclo.averageGrade = targetCiclo.classes.length > 0 
        ? Math.round((targetCiclo.classes.reduce((a, c) => a + c.averageGrade, 0) / targetCiclo.classes.length) * 10) / 10 
        : 12.5;

      targetCiclo.status = 'Submetido à Direcção';
      targetCiclo.submittedAt = new Date().toLocaleString('pt-MZ');
      targetCiclo.submittedClassesCount = targetCiclo.totalClasses;

      return copy;
    });
  }, []);

  /**
   * 3. DIRECTOR DA ESCOLA: Transforma estatísticas dos 3 ciclos em Estatística Consolidada da Escola e submete ao SDEJT (Distrito)
   */
  const consolidateAndSubmitSchoolToDistrict = useCallback((schoolId: string) => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      const prov = copy.provinces.find(p => p.provinceName === 'Cidade de Maputo');
      if (!prov || !prov.districts[0]?.schools[0]) return prev;

      const school = prov.districts[0].schools.find(s => s.id === schoolId) || prov.districts[0].schools[0];
      
      // Consolidate from 3 ciclos
      school.totalStudents = school.ciclos.reduce((acc, c) => acc + c.totalStudents, 0);
      school.maleStudents = school.ciclos.reduce((acc, c) => acc + c.maleStudents, 0);
      school.femaleStudents = school.ciclos.reduce((acc, c) => acc + c.femaleStudents, 0);
      school.approvedCount = school.ciclos.reduce((acc, c) => acc + c.approvedCount, 0);
      school.reprovedCount = school.ciclos.reduce((acc, c) => acc + c.reprovedCount, 0);
      school.droppedCount = school.ciclos.reduce((acc, c) => acc + c.droppedCount, 0);
      school.transferredCount = school.ciclos.reduce((acc, c) => acc + c.transferredCount, 0);
      school.passRate = school.totalStudents > 0 
        ? Math.round((school.approvedCount / school.totalStudents) * 1000) / 10 
        : 0;
      school.averageGrade = Math.round((school.ciclos.reduce((a, c) => a + c.averageGrade, 0) / (school.ciclos.length || 1)) * 10) / 10;

      school.status = 'Submetido ao Distrito';
      school.submittedAt = new Date().toLocaleString('pt-MZ');
      school.signedByDirector = true;

      // Update district submitted schools count
      const district = prov.districts[0];
      district.submittedSchoolsCount = Math.min(district.totalSchools, district.submittedSchoolsCount + 1);

      // Add archive copy organized by Number/Month, Year, Subject, Recipient
      try {
        addArchiveRecord({
          code: `EST-${school.schoolId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `Censo Censitário Consolidado • Escola: ${school.schoolName}`,
          type: 'Pauta Histórica',
          numberOrMonth: `0${Math.floor(1 + Math.random() * 89)}/03`,
          year: currentYear,
          subject: `Submissão de Estatísticas e Relatório Censitário Oficial`,
          recipient: `Direcção Distrital de Educação (SDEJT)`,
          boxNumber: 'CX-EST-02',
          shelfNumber: 'PRAT-02',
          room: `Arquivo Central da Escola ${school.schoolName}`,
          status: 'Arquivado',
          notes: `Cópia oficial arquivada para consulta institucional da escola ${school.schoolName}`
        });
      } catch (err) {
        console.warn(err);
      }

      return copy;
    });
  }, []);

  /**
   * 4. DISTRITO (SDEJT): Transforma estatísticas das escolas em Estatística do Distrito e submete à Província (DPE)
   */
  const consolidateAndSubmitDistrictToProvince = useCallback((districtId: string) => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      const prov = copy.provinces.find(p => p.provinceName === 'Cidade de Maputo');
      if (!prov || !prov.districts[0]) return prev;

      const district = prov.districts.find(d => d.id === districtId) || prov.districts[0];
      district.status = 'Submetido à Província';
      district.submittedAt = new Date().toLocaleString('pt-MZ');
      district.submittedSchoolsCount = district.totalSchools;

      // Update province submitted districts count
      prov.submittedDistrictsCount = Math.min(prov.totalDistricts, prov.submittedDistrictsCount + 1);

      return copy;
    });
  }, []);

  /**
   * 5. PROVÍNCIA (DPE): Transforma estatísticas dos distritos em Estatística Provincial e submete ao Ministério (MINEDH)
   */
  const consolidateAndSubmitProvinceToNational = useCallback((provinceName: string) => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      const prov = copy.provinces.find(p => p.provinceName === provinceName);
      if (!prov) return prev;

      prov.status = 'Submetido ao Ministério';
      prov.submittedAt = new Date().toLocaleString('pt-MZ');
      prov.submittedDistrictsCount = prov.totalDistricts;

      // Recalculate national totals
      copy.submittedProvincesCount = copy.provinces.filter(p => p.status === 'Submetido ao Ministério' || p.status === 'Homologado pelo MINEDH').length;
      copy.lastUpdatedAt = new Date().toISOString();

      return copy;
    });
  }, []);

  /**
   * 6. MINISTÉRIO (MINEDH): Transforma estatísticas de todas as províncias na Estatística Nacional Consolidada
   */
  const consolidateNationalData = useCallback(() => {
    setNationalData(prev => {
      const copy: NationalStatisticRecord = JSON.parse(JSON.stringify(prev));
      
      // Mark all provinces as homologated
      copy.provinces.forEach(p => {
        p.status = 'Homologado pelo MINEDH';
      });

      // Recalculate national aggregates
      copy.submittedProvincesCount = copy.totalProvinces;
      copy.totalStudents = copy.provinces.reduce((acc, p) => acc + p.totalStudents, 0);
      copy.maleStudents = copy.provinces.reduce((acc, p) => acc + p.maleStudents, 0);
      copy.femaleStudents = copy.provinces.reduce((acc, p) => acc + p.femaleStudents, 0);
      copy.approvedCount = copy.provinces.reduce((acc, p) => acc + p.approvedCount, 0);
      copy.reprovedCount = copy.provinces.reduce((acc, p) => acc + p.reprovedCount, 0);
      copy.droppedCount = copy.provinces.reduce((acc, p) => acc + p.droppedCount, 0);
      copy.transferredCount = copy.provinces.reduce((acc, p) => acc + p.transferredCount, 0);
      copy.passRate = Math.round((copy.approvedCount / copy.totalStudents) * 1000) / 10;
      copy.averageGrade = Math.round((copy.provinces.reduce((acc, p) => acc + p.averageGrade, 0) / copy.provinces.length) * 10) / 10;

      copy.status = 'Homologado & Publicado';
      copy.lastUpdatedAt = new Date().toISOString();

      return copy;
    });
  }, []);

  /**
   * Reset the whole workflow to default initial state
   */
  const resetWorkflow = useCallback(() => {
    const fresh = generateInitialData();
    setNationalData(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch (e) {
      console.warn(e);
    }
  }, [generateInitialData]);

  return {
    nationalData,
    activeSchool,
    currentYear,
    selectedProvinceName,
    setSelectedProvinceName,
    selectedDistrictName,
    setSelectedDistrictName,
    selectedSchoolId,
    setSelectedSchoolId,
    currentProvince,
    currentDistrict,
    submitClassToCiclo,
    consolidateAndSubmitCicloToSchool,
    consolidateAndSubmitSchoolToDistrict,
    consolidateAndSubmitDistrictToProvince,
    consolidateAndSubmitProvinceToNational,
    consolidateNationalData,
    resetWorkflow
  };
}
