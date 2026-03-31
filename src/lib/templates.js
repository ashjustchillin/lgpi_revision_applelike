export const FICHE_TEMPLATES = [
  {
    id: 'procedure',
    label: 'Procedure',
    icon: '📋',
    type: 'procedure',
    content: `## Contexte\nDecris la situation ou cette procedure s'applique.\n\n## Etapes\n1. Premiere etape\n2. Deuxieme etape\n3. Troisieme etape\n\n## Resultat attendu\nDecris ce que l'utilisateur doit obtenir.\n\n## Points d'attention\n- Point important 1\n- Point important 2`,
  },
  {
    id: 'bug',
    label: 'Bug resolu',
    icon: '🐛',
    type: 'attention',
    content: `## Symptome\nDecris le bug tel qu'il apparait.\n\n## Cause\nExplique l'origine du probleme.\n\n## Solution\n1. Etape de resolution 1\n2. Etape de resolution 2\n\n## Prevention\nComment eviter ce bug a l'avenir.`,
  },
  {
    id: 'astuce',
    label: 'Astuce',
    icon: '💡',
    type: 'astuce',
    content: `## L'astuce\nDecris l'astuce en une phrase claire.\n\n## Comment faire\n1. Etape 1\n2. Etape 2\n\n## Gain\nPourquoi cette astuce est utile.`,
  },
  {
    id: 'info',
    label: 'Information',
    icon: 'ℹ️',
    type: 'info',
    content: `## Description\nPresente l'information principale.\n\n## Details\n- Detail 1\n- Detail 2\n- Detail 3\n\n## A retenir\n**Point cle** a memoriser.`,
  },
  {
    id: 'blank',
    label: 'Vide',
    icon: '✏️',
    type: 'info',
    content: '',
  },
]
