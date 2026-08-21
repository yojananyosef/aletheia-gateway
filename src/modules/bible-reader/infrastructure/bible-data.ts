import type { TranslationId } from '../domain/entities/Translation';

export interface StaticPassageData {
  reference: string;
  book: string;
  chapter: number;
  title: string;
  translations: Record<TranslationId, string>;
}

export const BIBLE_PASSAGES_DATABASE: StaticPassageData[] = [
  {
    reference: 'Génesis 1:1',
    book: 'Génesis',
    chapter: 1,
    title: 'La creación',
    translations: {
      RVC: 'En el principio creó Dios los cielos y la tierra.',
      NBLA: 'En el principio Dios creó los cielos y la tierra.',
      NVI: 'Dios, en el principio, creó los cielos y la tierra.',
      NTV: 'En el principio, Dios creó los cielos y la tierra.',
      TLA: 'Cuando Dios comenzó a crear el cielo y la tierra,',
    },
  },
  {
    reference: 'Juan 3:16',
    book: 'Juan',
    chapter: 3,
    title: 'El amor de Dios hacia el mundo',
    translations: {
      RVC: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, sino que tenga vida eterna.',
      NBLA: 'Porque de tal manera amó Dios al mundo, que dio a Su Hijo unigénito, para que todo aquel que cree en Él, no se pierda, sino que tenga vida eterna.',
      NVI: 'Porque tanto amó Dios al mundo que dio a su Hijo unigénito, para que todo el que cree en él no se pierda, sino que tenga vida eterna.',
      NTV: 'Pues Dios amó tanto al mundo que dio a su único Hijo, para que todo el que crea en él no se pierda, sino que tenga vida eterna.',
      TLA: 'Dios amó tanto a la gente de este mundo, que entregó a su único Hijo, para que todo el que crea en él no se muera, sino que tenga vida eterna.',
    },
  },
  {
    reference: 'Salmos 23',
    book: 'Salmos',
    chapter: 23,
    title: 'El Señor es mi pastor',
    translations: {
      RVC: 'El Señor es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
      NBLA: 'El Señor es mi pastor, nada me faltará. En lugares de verdes pastos me hace descansar; junto a aguas de reposo me conduce.',
      NVI: 'El Señor es mi pastor, nada me falta; en verdes pastos me hace descansar. Junto a tranquilas aguas me conduce.',
      NTV: 'El Señor es mi pastor; tengo todo lo que necesito. En verdes praderas me deja descansar; me conduce junto a arroyos tranquilos.',
      TLA: 'Tú, Dios mío, eres mi pastor; contigo nada me falta. Me haces descansar en verdes pastos, y me guías hacia arroyos de aguas tranquilas.',
    },
  },
  {
    reference: 'Proverbios 3:5',
    book: 'Proverbios',
    chapter: 3,
    title: 'Confianza en el Señor',
    translations: {
      RVC: 'Confía en el Señor de todo corazón, y no te apoyes en tu propia prudencia.',
      NBLA: 'Confía en el Señor con todo tu corazón, y no te apoyes en tu propio entendimiento.',
      NVI: 'Confía en el Señor de todo corazón, y no en tu propia inteligencia.',
      NTV: 'Confía en el Señor con todo tu corazón; no dependas de tu propio entendimiento.',
      TLA: 'Pon toda tu confianza en Dios y no en lo que sabes.',
    },
  },
  {
    reference: 'Filipenses 4:13',
    book: 'Filipenses',
    chapter: 4,
    title: 'Fortaleza en Cristo',
    translations: {
      RVC: '¡Todo lo puedo en Cristo que me fortalece!',
      NBLA: 'Todo lo puedo en Cristo que me fortalece.',
      NVI: 'Cristo me da fuerzas para enfrentarme a toda clase de situaciones.',
      NTV: 'Pues todo lo puedo hacer por medio de Cristo, quien me da las fuerzas.',
      TLA: '¡Dios me da fuerzas para enfrentar cualquier situación!',
    },
  },
  {
    reference: 'Romanos 8:28',
    book: 'Romanos',
    chapter: 8,
    title: 'Más que vencedores',
    translations: {
      RVC: 'Ahora bien, sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados conforme a su propósito.',
      NBLA: 'Y sabemos que para los que aman a Dios, todas las cosas cooperan para bien, esto es, para los que son llamados conforme a Su propósito.',
      NVI: 'Ahora bien, sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados de acuerdo con su propósito.',
      NTV: 'Y sabemos que Dios hace que todas las cosas cooperen para el bien de quienes lo aman y son llamados según el propósito que él tiene para ellos.',
      TLA: 'Sabemos que Dios va preparando todo para el bien de los que lo aman, es decir, de los que él ha llamado de acuerdo con su plan.',
    },
  },
];
