export const SUPER_ADMINS = [
  'sistemas@colegiolondres.edu.co',
  'licencias@colegiolondres.edu.co'
]

export const TEACHER_DATA: Record<string, { nombre: string; materias: Record<string, string[]> }> = {
  'integradastransicion@colegiolondres.edu.co': {
    nombre: 'Maria Daniela Ortíz',
    materias: { transicion: ['Dim. Socioafectiva','Dim. Comunicativa','Dim. Cognitiva Lóg-Mat','Dim. Cognitiva C. Nat','Dim. Ética'] }
  },
  'integradasprimero@colegiolondres.edu.co': {
    nombre: 'Maria Camila Londoño',
    materias: { '1':['Artística','L. Castellana','Sociales','Ed. Ética'], '2':['L. Castellana','Ed. Ética'], '3':['Ed. Ética'] }
  },
  'cienciasprimaria@colegiolondres.edu.co': {
    nombre: 'Juliana Valencia López',
    materias: { '1':['C. Naturales'],'2':['C. Naturales'],'3':['C. Naturales'],'4':['Ciencias Naturales'],'5':['Ciencias Naturales'],'6':['C. Naturales'] }
  },
  'castellano@colegiolondres.edu.co': {
    nombre: 'Aicardo Rivera Montoya',
    materias: { '3':['L. Castellana'],'4':['Lengua Castellana'],'5':['Lengua Castellana'],'6':['L. Castellana'],'7':['Plan Lector'] }
  },
  'sistemas@colegiolondres.edu.co': {
    nombre: 'John Arley López Jaramillo',
    materias: { '2':['Tecnología'],'3':['Tecnología'],'4':['Tecnología'],'5':['Tecnología'],'6':['Tecnología e Informática'],'7':['Tecnología e Informática'],'8':['Tecnología e Informática'],'9':['Tecnología e Informática'],'10':['Tecnología e Informática'],'11':['Tecnología e Informática'] }
  },
  'artes@colegiolondres.edu.co': {
    nombre: 'Eduardo Correa Rivera',
    materias: { '2':['Ciencias Sociales','Cátedra','Artística'],'3':['Ciencias Sociales','Cátedra','Artística'],'4':['Ciencias Sociales','Cátedra','Artística'],'5':['Ciencias Sociales','Cátedra','Artística'],'6':['Ed. Artística'],'7':['Ed. Artística'],'8':['Ed. Artística'],'9':['Ed. Artística'],'10':['Ed. Artística'],'11':['Ed. Artística'] }
  },
  'matematicasprimaria@colegiolondres.edu.co': {
    nombre: 'Alba Mery Martínez',
    materias: { '2':['Geometría'],'3':['Matemáticas','Geometría'],'4':['Matemáticas','Geometría'],'5':['Matemáticas','Geometría'] }
  },
  'matematicasbachillerato@colegiolondres.edu.co': {
    nombre: 'Nohora M. Mosquera Naranjo',
    materias: { '6':['Matemáticas','Geometría y Estadística'],'7':['Matemáticas','Geometría y Estadística'],'8':['Geometría y Estadística'],'9':['Geometría y Estadística'],'10':['Geometría y Estadística'],'11':['Geometría y Estadística'] }
  },
  'matematicas@colegiolondres.edu.co': {
    nombre: 'Julián Restrepo Rodríguez',
    materias: { '8':['Matemáticas'],'9':['Matemáticas','Física'],'10':['Matemáticas','Física'],'11':['Matemáticas','Física'] }
  },
  'l.quesada@colegiolondres.edu.co': {
    nombre: 'Liliana Katerine Quesada',
    materias: { '5':['Inglés'],'8':['Inglés'],'11':['Inglés'] }
  },
  'g.alvarez@colegiolondres.edu.co': {
    nombre: 'Génesis Álvarez Muñoz',
    materias: { '2':['Inglés'],'4':['Inglés'],'7':['Inglés'],'10':['Inglés'] }
  },
  'a.gonzalez@colegiolondres.edu.co': {
    nombre: 'Alejandro González',
    materias: { '1':['Inglés'],'3':['Inglés'],'6':['Inglés'],'9':['Inglés'] }
  },
  'deportes@colegiolondres.edu.co': {
    nombre: 'Juan Felipe Heredia',
    materias: { transicion:['Ed. Física'],'1':['Ed. Física'],'2':['Ed. Física'],'3':['Ed. Física'],'4':['Educación Física'],'5':['Educación Física'],'6':['Ed. Física'],'7':['Ed. Física'],'8':['Ed. Física'],'9':['Ed. Física'],'10':['Ed. Física'],'11':['Ed. Física'] }
  },
  'cienciasnaturales@colegiolondres.edu.co': {
    nombre: 'Jhennifer Montealegre',
    materias: { '7':['C. Naturales'],'8':['C. Naturales'],'9':['Biología','Química'],'10':['Biología','Química'],'11':['Biología','Química'] }
  },
  'socialesbachillerato@colegiolondres.edu.co': {
    nombre: 'Ivonne Cortés',
    materias: { '6':['Sociales'],'7':['Sociales'],'8':['Sociales'],'9':['Sociales'],'10':['Sociales','C. Política y Económicas','Filosofía'],'11':['Sociales','C. Política y Económicas','Filosofía'] }
  },
  'castellanobachillerato@colegiolondres.edu.co': {
    nombre: 'Ana Carolina Ruíz Villada',
    materias: { '7':['L. Castellana'],'8':['L. Castellana','Ed. Ética y Religiosa'],'9':['L. Castellana','Ed. Ética y Religiosa'],'10':['L. Castellana','Ed. Ética y Religiosa'],'11':['L. Castellana','Ed. Ética y Religiosa'] }
  },
  'geometriaprimaria@colegiolondres.edu.co': {
    nombre: 'Estefanía Correa',
    materias: { '1':['Matemáticas','Tecnología'],'2':['Matemáticas'],'3':['Religión'],'4':['Ética y Religión'],'5':['Ética y Religión'],'6':['Ed. Ética y Religiosa'],'7':['Ed. Ética y Religiosa'] }
  },
  'licencias@colegiolondres.edu.co': {
    nombre: 'Administrador',
    materias: {}
  }
}

export const MATERIAS_BACHILLERATO: Record<string, string[]> = {
  '4': ['Ciencias Naturales','Ciencias Sociales','Artística','Ética y Religión','Educación Física','Lengua Castellana','Inglés','Matemáticas','Geometría','Tecnología'],
  '5': ['Ciencias Naturales','Ciencias Sociales','Artística','Ética y Religión','Educación Física','Lengua Castellana','Inglés','Matemáticas','Geometría','Tecnología'],
  '6': ['C. Naturales','L. Castellana','Ed. Ética y Religiosa','Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Inglés','Ed. Física','Sociales'],
  '7': ['Plan Lector','Ed. Ética y Religiosa','Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Inglés','Ed. Física','C. Naturales','Sociales','L. Castellana'],
  '8': ['Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Inglés','Ed. Física','C. Naturales','Sociales','L. Castellana','Ed. Ética y Religiosa'],
  '9': ['Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Física','Inglés','Ed. Física','Biología','Química','Sociales','L. Castellana','Ed. Ética y Religiosa'],
  '10': ['Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Física','Inglés','Ed. Física','Química','Biología','Sociales','C. Política y Económicas','Filosofía','L. Castellana','Ed. Ética y Religiosa'],
  '11': ['Tecnología e Informática','Ed. Artística','Geometría y Estadística','Matemáticas','Física','Inglés','Ed. Física','Química','Biología','Sociales','C. Política y Económicas','Filosofía','L. Castellana','Ed. Ética y Religiosa']
}

export const GRADE_NAMES: Record<string, string> = {
  transicion:'Transición','1':'1°','2':'2°','3':'3°','4':'4°','5':'5°',
  '6':'6°','7':'7°','8':'8°','9':'9°','10':'10°','11':'11°'
}

export function normalizeGrade(g: string): string {
  const s = String(g).trim().toLowerCase().replace(/°/g, '').replace(/\s+/g, '')
  const map: Record<string, string> = {
    transicion:'transicion', transición:'transicion', tr:'transicion',
    '0':'transicion', pre:'transicion',
    primero:'1', segundo:'2', tercero:'3', cuarto:'4', quinto:'5',
    sexto:'6', septimo:'7', séptimo:'7', octavo:'8',
    noveno:'9', decimo:'10', décimo:'10', once:'11', undecimo:'11'
  }
  return map[s] || s
}

export function getFormType(gradeNorm: string): 'none' | 'global' | 'bachillerato' {
  if (gradeNorm === 'transicion' || gradeNorm === '1') return 'none'
  if (gradeNorm === '2' || gradeNorm === '3') return 'global'
  return 'bachillerato'
}