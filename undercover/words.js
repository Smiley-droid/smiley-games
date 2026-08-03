// Données du jeu : les paires de mots regroupées par catégorie (civil / undercover),
// et les libellés de rôles. C'est le seul fichier à modifier pour ajouter,
// retirer, traduire des mots, ou créer de nouvelles catégories.

/* ---------------------------------------------------------
   DONNÉES
--------------------------------------------------------- */
const WORD_CATEGORIES = {
  "Nourriture salée": [
    ["Pizza","Quiche"],["Sandwich","Burger"],["Soupe","Bouillon"],["Salade","Crudités"],
    ["Riz","Pâtes"],["Omelette","Crêpe"],["Frites","Chips"],["Ravioli","Tortellini"],
    ["Kebab","Tacos"],["Couscous","Paella"],["Fondue","Raclette"],["Croque-monsieur","Panini"],
    ["Bouillabaisse","Velouté"],["Falafel","Nugget"],["Choucroute","Cassoulet"],["Nouilles","Vermicelles"],
    ["Gratin","Lasagne"],["Terrine","Pâté"],["Bruschetta","Tartine"],["Empanada","Chausson"],
    ["Risotto","Polenta"],["Pilon de poulet","Côtelette"],["Bagel","Pain pita"],["Quenelle","Boulette"],
  ],
  "Desserts & sucré": [
    ["Gâteau","Tarte"],["Chocolat","Bonbon"],["Glace","Sorbet"],["Biscuit","Gaufre"],
    ["Confiture","Miel"],["Crème brûlée","Flan"],["Macaron","Meringue"],["Beignet","Churros"],
    ["Cheesecake","Tiramisu"],["Nougat","Caramel"],["Éclair","Religieuse"],["Cannelé","Financier"],
    ["Sorbet","Granité"],["Pain d'épices","Spéculoos"],["Guimauve","Marshmallow"],["Crêpe","Blini"],
    ["Brioche","Panettone"],["Tarte Tatin","Clafoutis"],["Barbe à papa","Chewing-gum"],["Praline","Truffe au chocolat"],
  ],
  "Boissons": [
    ["Café","Thé"],["Jus","Soda"],["Vin","Cidre"],["Bière","Champagne"],
    ["Lait","Chocolat chaud"],["Limonade","Sirop"],["Cocktail","Mocktail"],["Smoothie","Milkshake"],
    ["Eau gazeuse","Eau plate"],["Infusion","Tisane"],["Cappuccino","Latte"],["Punch","Sangria"],
  ],
  "Animaux terrestres": [
    ["Chat","Chien"],["Lion","Tigre"],["Loup","Renard"],["Cheval","Âne"],
    ["Vache","Bison"],["Mouton","Chèvre"],["Ours","Panda"],["Éléphant","Rhinocéros"],
    ["Girafe","Zèbre"],["Singe","Gorille"],["Lapin","Lièvre"],["Écureuil","Hamster"],
    ["Cochon","Sanglier"],["Cerf","Élan"],["Kangourou","Wallaby"],["Hérisson","Tatou"],
    ["Léopard","Guépard"],["Chameau","Dromadaire"],["Souris","Rat"],["Furet","Belette"],
  ],
  "Animaux marins": [
    ["Baleine","Dauphin"],["Requin","Barracuda"],["Poulpe","Calamar"],["Étoile de mer","Oursin"],
    ["Crabe","Homard"],["Méduse","Anémone"],["Phoque","Otarie"],["Tortue de mer","Iguane marin"],
    ["Anguille","Murène"],["Hippocampe","Poisson-clown"],["Corail","Algue"],["Crevette","Écrevisse"],
  ],
  "Oiseaux": [
    ["Aigle","Faucon"],["Perroquet","Perruche"],["Hibou","Chouette"],["Pingouin","Manchot"],
    ["Corbeau","Corneille"],["Cygne","Oie"],["Flamant rose","Héron"],["Colibri","Libellule"],
    ["Pigeon","Tourterelle"],["Autruche","Émeu"],["Toucan","Perroquet ara"],["Vautour","Charognard"],
  ],
  "Insectes & petites bêtes": [
    ["Fourmi","Termite"],["Abeille","Guêpe"],["Papillon","Mite"],["Coccinelle","Scarabée"],
    ["Araignée","Scorpion"],["Sauterelle","Criquet"],["Mille-pattes","Chenille"],["Escargot","Limace"],
  ],
  "Créatures fantastiques & légendaires": [
    ["Fantôme","Squelette"],["Vampire","Zombie"],["Pirate","Ninja"],["Sorcière","Magicien"],
    ["Dragon","Serpent géant"],["Licorne","Pégase"],["Sirène","Triton"],["Troll","Ogre"],
    ["Elfe","Gnome"],["Loup-garou","Golem"],["Géant","Titan"],["Génie","Fée"],
  ],
  "Métiers": [
    ["Médecin","Infirmier"],["Pompier","Policier"],["Boulanger","Pâtissier"],["Menuisier","Charpentier"],
    ["Facteur","Livreur"],["Coiffeur","Esthéticienne"],["Professeur","Instituteur"],["Avocat","Juge"],
    ["Plombier","Électricien"],["Agriculteur","Éleveur"],["Journaliste","Photographe"],["Vétérinaire","Éleveur canin"],
    ["Chirurgien","Dentiste"],["Cuisinier","Serveur"],["Pilote","Steward"],["Architecte","Ingénieur"],
    ["Bibliothécaire","Libraire"],["Marin","Pêcheur"],["Astronaute","Cosmonaute"],["Jardinier","Paysagiste"],
  ],
  "Sports": [
    ["Football","Rugby"],["Basketball","Handball"],["Tennis","Badminton"],["Natation","Plongée"],
    ["Ski","Snowboard"],["Cyclisme","Course à pied"],["Boxe","Karaté"],["Escalade","Randonnée"],
    ["Golf","Croquet"],["Volleyball","Beach-volley"],["Judo","Lutte"],["Patinage","Roller"],
    ["Aviron","Kayak"],["Surf","Bodyboard"],["Équitation","Voltige"],["Bowling","Pétanque"],
    ["Gymnastique","Danse"],["Escrime","Tir à l'arc"],
  ],
  "Transports": [
    ["Voiture","Moto"],["Avion","Hélicoptère"],["Camion","Bus"],["Train","Tramway"],
    ["Vélo","Trottinette"],["Bateau","Voilier"],["Métro","RER"],["Fusée","Satellite"],
    ["Gondole","Kayak"],["Montgolfière","Planeur"],["Taxi","Covoiturage"],["Sous-marin","Bateau à moteur"],
  ],
  "Nature & paysages": [
    ["Montagne","Colline"],["Rivière","Lac"],["Île","Presqu'île"],["Cascade","Fontaine"],
    ["Volcan","Geyser"],["Désert","Steppe"],["Forêt","Jungle"],["Grotte","Caverne"],
    ["Falaise","Ravin"],["Vallée","Gorge"],["Plage","Dune"],["Marais","Étang"],
    ["Glacier","Iceberg"],["Prairie","Savane"],["Récif","Lagon"],["Oasis","Mirage"],
  ],
  "Météo & phénomènes": [
    ["Neige","Pluie"],["Foudre","Tonnerre"],["Tornade","Ouragan"],["Comète","Météore"],
    ["Arc-en-ciel","Aurore boréale"],["Brouillard","Brume"],["Grêle","Verglas"],["Canicule","Sécheresse"],
  ],
  "Objets du quotidien": [
    ["Stylo","Crayon"],["Téléphone","Tablette"],["Bougie","Lampe"],["Sac à dos","Valise"],
    ["Parapluie","Poncho"],["Montre","Réveil"],["Miroir","Vitre"],["Coussin","Oreiller"],
    ["Balai","Aspirateur"],["Ciseaux","Cutter"],["Boussole","Carte"],["Clé","Cadenas"],
    ["Panier","Cabas"],["Thermos","Gourde"],["Échelle","Escabeau"],["Corde","Ficelle"],
  ],
  "Technologie": [
    ["Ordinateur","Tablette"],["Casque audio","Écouteurs"],["Robot","Androïde"],["Drone","Hélicoptère"],
    ["Imprimante","Scanner"],["Manette","Clavier"],["Enceinte","Haut-parleur"],["Caméra","Appareil photo"],
    ["Batterie","Chargeur"],["Antenne","Parabole"],
  ],
  "Vêtements": [
    ["Cape","Manteau"],["Kimono","Sari"],["Chapeau","Casquette"],["Écharpe","Foulard"],
    ["Gants","Moufles"],["Bottes","Baskets"],["Costume","Smoking"],["Robe","Jupe"],
    ["Pull","Gilet"],["Ceinture","Bretelles"],["Sandales","Tongs"],["Uniforme","Blouse"],
  ],
  "Instruments de musique": [
    ["Guitare","Violon"],["Piano","Clavier"],["Batterie","Percussion"],["Flûte","Clarinette"],
    ["Trompette","Trombone"],["Harpe","Lyre"],["Accordéon","Orgue"],["Saxophone","Hautbois"],
  ],
  "Bâtiments & lieux": [
    ["Château","Palais"],["Bibliothèque","Librairie"],["Cathédrale","Église"],["Marché","Supermarché"],
    ["Igloo","Cabane"],["Cirque","Théâtre"],["Jardin","Parc"],["Bureau","Atelier"],
    ["Musée","Galerie"],["Aéroport","Gare"],["Hôpital","Clinique"],["Hôtel","Auberge"],
    ["Prison","Forteresse"],["Ferme","Ranch"],["Phare","Tour"],["Moulin","Silo"],
  ],
  "Corps humain & santé": [
    ["Main","Pied"],["Œil","Oreille"],["Squelette","Muscle"],["Fièvre","Rhume"],
    ["Pansement","Bandage"],["Lunettes","Loupe"],["Béquille","Fauteuil roulant"],["Vaccin","Médicament"],
  ],
  "École & bureau": [
    ["Cahier","Carnet"],["Trousse","Sac de cours"],["Tableau","Écran"],["Craie","Marqueur"],
    ["Colle","Ruban adhésif"],["Règle","Équerre"],["Gomme","Correcteur"],["Agrafeuse","Perforatrice"],
  ],
  "Jardin & outils": [
    ["Marteau","Tournevis"],["Pelle","Râteau"],["Arrosoir","Tuyau"],["Tondeuse","Débroussailleuse"],
    ["Serre","Potager"],["Champignon","Truffe"],["Cactus","Bambou"],["Tronçonneuse","Hache"],
  ],
  "Jeux & loisirs": [
    ["Trampoline","Balançoire"],["Cerf-volant","Frisbee"],["Toupie","Yoyo"],["Puzzle","Casse-tête"],
    ["Dés","Cartes"],["Échecs","Dames"],["Marionnette","Poupée"],["Fléchettes","Billard"],
  ],
  "Divers": [
    ["Diamant","Cristal"],["Sable","Terre"],["Boussole","Carte routière"],["Trésor","Coffre"],
    ["Statue","Sculpture"],["Encre","Peinture"],["Miel","Sirop d'érable"],["Perle","Coquillage"],
  ],
  "Célébrités": [
    ["Albert Einstein","Isaac Newton"],["Léonard de Vinci","Michel-Ange"],["Mozart","Beethoven"],["Picasso","Salvador Dalí"],
    ["Vincent van Gogh","Claude Monet"],["Charlie Chaplin","Buster Keaton"],["Elvis Presley","Michael Jackson"],["Madonna","Lady Gaga"],
    ["Beyoncé","Rihanna"],["Freddie Mercury","David Bowie"],["Cristiano Ronaldo","Lionel Messi"],["Serena Williams","Venus Williams"],
    ["Usain Bolt","Carl Lewis"],["Mohamed Ali","Mike Tyson"],["Marilyn Monroe","Audrey Hepburn"],["Steve Jobs","Bill Gates"],
    ["Nikola Tesla","Thomas Edison"],["Shakespeare","Molière"],["Victor Hugo","Émile Zola"],["Napoléon Bonaparte","Jules César"],
    ["Cléopâtre","Néfertiti"],["Gandhi","Nelson Mandela"],["Marie Curie","Ada Lovelace"],["Walt Disney","George Lucas"],
    ["Steven Spielberg","James Cameron"],["Pelé","Diego Maradona"],["Tom Cruise","Brad Pitt"],["Leonardo DiCaprio","Johnny Depp"],
    ["Jackie Chan","Bruce Lee"],["Whitney Houston","Céline Dion"],
  ],
  "Dessins animés & films": [
    ["Mickey Mouse","Donald Duck"],["Blanche-Neige","Cendrillon"],["Batman","Superman"],["Spider-Man","Iron Man"],
    ["Homer Simpson","Peter Griffin"],["Bugs Bunny","Daffy Duck"],["Tom","Jerry"],["Bob l'éponge","Patrick Star"],
    ["Shrek","Fiona"],["Woody","Buzz l'Éclair"],["Simba","Mufasa"],["Elsa","Anna"],
    ["Harry Potter","Hermione Granger"],["Dark Vador","Yoda"],["Gandalf","Dumbledore"],["Sherlock Holmes","Hercule Poirot"],
    ["James Bond","Jason Bourne"],["Dracula","Frankenstein"],["Astérix","Obélix"],["Tintin","Spirou"],
    ["Naruto","Sasuke"],["Son Goku","Vegeta"],["Pikachu","Salamèche"],["Winnie l'ourson","Tigrou"],
    ["Aladdin","Jasmine"],["Nemo","Dory"],["Luke Skywalker","Han Solo"],["Joker","Bane"],
    ["Wonder Woman","Catwoman"],["Rémy (Ratatouille)","Wall-E"],
  ],
};

const ROLE_LABEL = {
  civil:"Civil",
  undercover:"Undercover",
  mrwhite:"Mr. White",
};
const SPECIAL_LABEL = { detective:"Détective", jester:"Bouffon", protector:"Garde du corps", avenger:"Vengeur" };
