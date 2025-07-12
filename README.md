# Prompt Mafia (Subterfuge(nouveau nom ^^)) 

## Installation et Lancement

### Prérequis
- Node.js installé sur votre machine

### Installation
```bash
# Dans le dossier /server
cd server
npm i
npm run start

# Dans le dossier /client (dans un autre terminal)
cd client
npm i
npm run dev
```

# Règles du Jeu

## Objectif du Jeu

**Prompt Mafia** est un jeu de déduction et de créativité où les joueurs doivent identifier l'intrus parmi eux en analysant les images générées par IA.

## Participants

- **Minimum** : 3 joueurs
- **Recommandé** : 4-8 joueurs
- **Un intrus** parmi les joueurs
- **Le reste** : joueurs innocents

## Préparation

1. **Tous les joueurs rejoignent** la même room
2. **Attribution des rôles** :
   - **Joueurs innocents** : Reçoivent le même mot-clé (ex: "Chat")
   - **L'intrus** : Reçoit un mot similaire mais différent (ex: "Tigre")
3. **Personne ne connaît** l'identité de l'intrus au début

## Phase de Création (Tour par Tour)

1. **Chaque joueur** crée un prompt à son tour
2. **L'IA génère une image** basée sur le prompt
3. **Contrainte importante** : Le joueur ne peut **PAS** mentionner directement son mot-clé dans le prompt
4. **Objectif** :
   - **Innocents** : Créer un prompt qui montre qu'ils connaissent le "vrai" mot sans le dire
   - **Intrus** : Essayer de deviner le mot des autres et créer un prompt crédible

## Phase de Discussion

1. **Tous les joueurs** voient toutes les images générées
2. **Discussion libre** pour analyser les images
3. **Timer de 60 secondes** pour débattre
4. **Chacun essaie** de repérer qui pourrait être l'intrus

## Phase de Vote

1. **Chaque joueur vote** pour éliminer un suspect
2. **Option "Passer"** disponible si personne n'est sûr
3. **Vote majoritaire** détermine qui est éliminé
4. **Égalité** = personne n'est éliminé ce round

## Conditions de Victoire

### **Les Innocents gagnent si :**
- Ils éliminent l'intrus
- L'intrus est découvert

### **L'Intrus gagne si :**
- Il survit jusqu'à ce qu'il ne reste qu'un innocent
- Il passe inaperçu suffisamment longtemps

## Système Multi-Round

1. **Si l'intrus n'est pas éliminé** : nouveau round
2. **Nouvel ordre de jeu** pour les joueurs restants
3. **Nouvelles images** à créer
4. **Le jeu continue** jusqu'à ce qu'il y ait un gagnant

## Conseils Stratégiques

### **Pour les Innocents :**
- Créez des prompts qui montrent subtilement que vous connaissez le "vrai" mot
- Observez les images qui semblent "à côté" du thème
- Collaborez discrètement pendant la discussion

### **Pour l'Intrus :**
- Essayez de deviner le mot commun en analysant les premières images
- Créez un prompt qui pourrait correspondre aux deux mots
- Semez le doute sur d'autres joueurs

## Règles Importantes

1. **Interdit** de mentionner directement son mot-clé dans le prompt
2. **Pas de communication** hors du chat du jeu
3. **Respecter le timer** de discussion
4. **Une fois le vote confirmé**, impossible de changer d'avis

## Exemple de Partie

**Mot des innocents** : "Chat"  
**Mot de l'intrus** : "Tigre"

**Prompts possibles :**
- Innocent : "Un animal domestique ronronnant sur un canapé"
- Intrus : "Un félin rayé dans la savane" (trop évident)
- Intrus malin : "Un petit félin jouant avec une pelote de laine" (plus discret)

---

**Amusez-vous bien et que le meilleur gagne !** 