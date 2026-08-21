import type { TranslationId } from '../domain/entities/Translation';

export interface StaticPassageData {
  reference: string;
  book: string;
  chapter: number;
  title: string;
  translations: Record<string, string>;
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
      RVR1960: 'En el principio creó Dios los cielos y la tierra.',
      DHH: 'En el comienzo de todo, Dios creó el cielo y la tierra.',
      LBLA: 'En el principio creó Dios los cielos y la tierra.',
      PDT: 'En el principio, Dios creó los cielos y la tierra.',
    },
  },
  {
    reference: 'Rut 1:6-8',
    book: 'Rut',
    chapter: 1,
    title: 'Noemí y Rut regresan a Judá',
    translations: {
      RVC: 'Cuando Noemí se enteró de que el Señor había bendecido a su pueblo y que el hambre había terminado, decidió abandonar Moab junto con sus nueras. Las tres mujeres salieron de donde habían vivido, y emprendieron el camino de vuelta a la tierra de Judá.',
      NBLA: 'Entonces se levantó con sus nueras para regresar de la tierra de Moab, porque ella había oído en la tierra de Moab que el Señor había visitado a Su pueblo dándole alimento. Salió, pues, del lugar donde estaba, y sus dos nueras con ella, y se pusieron en camino para volver a la tierra de Judá.',
      NVI: 'Noemí decidió regresar de la tierra de Moab con sus dos nueras, porque allí se enteró de que el Señor había acudido en ayuda de su pueblo al proveerle de alimento. Salió, pues, con sus dos nueras del lugar donde había vivido, y juntas emprendieron el camino que las llevaría de regreso a Judá.',
      NTV: 'Estando en Moab, Noemí se enteró de que el Señor había bendecido a su pueblo en Judá al volver a darle buenas cosechas. Entonces Noemí y sus nueras se prepararon para salir de Moab y regresar a su tierra natal.',
      TLA: 'Un día, Noemí supo que Dios había bendecido al país de Israel, dándole abundantes cosechas. Entonces ella y sus nueras se prepararon para irse a Judá. Todavía no habían caminado mucho cuando Noemí les dijo: —Vuelvan a su casa con sus madres.',
      RVR1960: 'Entonces se levantó con sus nueras, y regresó de los campos de Moab; porque oyó en el campo de Moab que Jehová había visitado a su pueblo para darles pan.',
      DHH: 'Un día Noemí oyó en Moab que el Señor había bendecido a su pueblo dándole buenas cosechas, y decidió regresar a Judá con sus dos nueras.',
      LBLA: 'Entonces se levantó con sus nueras para regresar de la tierra de Moab, porque oyó en la tierra de Moab que el Señor había visitado a su pueblo dándole alimento.',
      PDT: 'Tiempo después, Noemí oyó en Moab que el Señor había venido en ayuda de su pueblo dándole alimento. Así que se preparó para salir de Moab con sus nueras.',
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
      RVR1960: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
      DHH: 'Pues Dios amó tanto al mundo, que dio a su Hijo único, para que todo aquel que cree en él no muera, sino que tenga vida eterna.',
      LBLA: 'Porque de tal manera amó Dios al mundo, que dio a su Hijo unigénito, para que todo aquel que cree en El, no se pierda, mas tenga vida eterna.',
      PDT: 'Dios amó tanto al mundo que dio a su Hijo único para que todo el que crea en él no se pierda, sino que tenga vida eterna.',
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
      RVR1960: 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
      DHH: 'El Señor es mi pastor; nada me falta. En verdes praderas me hace descansar, a las aguas tranquilas me conduce.',
      LBLA: 'El Señor es mi pastor, nada me faltará. En lugares de verdes pastos me hace descansar; junto a aguas de reposo me conduce.',
      PDT: 'El Señor es mi pastor; nada me falta. Me hace descansar en verdes pastos y me guía a fuentes de aguas tranquilas.',
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
      RVR1960: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.',
      DHH: 'Confía de todo corazón en el Señor y no en tu propia inteligencia.',
      LBLA: 'Confía en el Señor con todo tu corazón, y no te apoyes en tu propio entendimiento.',
      PDT: 'Confía en el Señor de todo corazón y no en tu propia inteligencia.',
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
      RVR1960: 'Todo lo puedo en Cristo que me fortalece.',
      DHH: 'A todo puedo hacerle frente, gracias a Cristo que me fortalece.',
      LBLA: 'Todo lo puedo en Cristo que me fortalece.',
      PDT: 'Puedo enfrentar cualquier situación porque Cristo me da el poder para hacerlo.',
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
      RVR1960: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
      DHH: 'Sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, a los cuales él ha llamado de acuerdo con su propósito.',
      LBLA: 'Y sabemos que para los que aman a Dios, todas las cosas cooperan para bien, esto es, para los que son llamados conforme a su propósito.',
      PDT: 'Sabemos que Dios hace que todas las cosas resulten para el bien de los que lo aman, a quienes ha llamado según su propósito.',
    },
  },
];
