-- Ten complete starter lessons for Halaqa.
-- Content should still receive final scholarly/editorial review before production launch.

insert into public.lessons
  (title, theme, body_text, ayat, ayat_transliteration, ayat_translation, ayat_reference, hadith, hadith_reference, reflection_prompts, status, is_custom)
values
(
  'Gratitude That Deepens the Heart',
  'Gratitude',
  'Gratitude begins when the heart notices that every blessing has a Giver. It is not only spoken with the tongue; it is protected through obedience, humility, and service.

This week, slow down enough to name specific blessings. Ask how each blessing can be used in a way that pleases Allah instead of simply being consumed and forgotten.',
  'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
  'Fadhkuroonee adhkurkum washkuroo lee wa la takfuroon.',
  'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
  'Surah Al-Baqarah 2:152',
  'The affair of the believer is wonderful: if something good happens, he is grateful and that is good for him; if hardship happens, he is patient and that is good for him.',
  'Sahih Muslim 2999',
  '["What is one blessing you often overlook, and how can you honor it this week?"]'::jsonb,
  'published',
  false
),
(
  'Patience Without Numbness',
  'Patience',
  'Sabr is not pretending pain does not exist. It is faithful steadiness while the heart continues to turn toward Allah with honesty and hope.

Patience can include tears, dua, asking for help, and taking the next right step. The goal is not to become hard; it is to remain connected.',
  'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
  'Ya ayyuha allatheena amanoo istaAAeenoo bissabri wassalah; inna Allaha maAAa assabireen.',
  'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
  'Surah Al-Baqarah 2:153',
  'Patience is at the first strike of calamity.',
  'Sahih al-Bukhari 1302; Sahih Muslim 926',
  '["Where are you being invited to practice patience without becoming hard?"]'::jsonb,
  'published',
  false
),
(
  'The Weight of Intention',
  'Niyyah',
  'Intention gives direction to action. Two people may do the same outward deed, but the inner aim changes what that deed becomes before Allah.

This lesson invites us to renew ordinary routines: work, study, family care, rest, and service. A sincere intention can turn daily life into worship.',
  'وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ',
  'Wa ma omiroo illa liyaAAbudoo Allaha mukhliseena lahu addeen.',
  'And they were not commanded except to worship Allah, being sincere to Him in religion.',
  'Surah Al-Bayyinah 98:5',
  'Actions are only by intentions, and every person will have only what they intended.',
  'Sahih al-Bukhari 1; Sahih Muslim 1907',
  '["What ordinary action could you renew with a clearer intention this week?"]'::jsonb,
  'published',
  false
),
(
  'Dua With Nearness',
  'Dua',
  'Dua is not a last resort. It is the language of need, trust, and nearness to Allah. The believer asks because Allah is near and because dependence on Him is honor.

Bring your actual life into dua: the beautiful, the confusing, the embarrassing, and the unfinished. Nothing sincere is too small to ask Allah about.',
  'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
  'Wa itha saalaka AAibadee AAannee fa-innee qareeb.',
  'And when My servants ask you concerning Me, indeed I am near.',
  'Surah Al-Baqarah 2:186',
  'Dua is worship.',
  'Jami at-Tirmidhi 3372',
  '["What dua have you been hesitant to make with your whole heart?"]'::jsonb,
  'published',
  false
),
(
  'The Tongue as a Trust',
  'Speech',
  'Speech can build safety or break it. Islam teaches us to treat words as accountable, not casual, because every sentence carries weight.

This week, notice the moment before speaking: is this true, needed, merciful, and pleasing to Allah? Restraint can be an act of worship.',
  'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَقُولُوا قَوْلًا سَدِيدًا',
  'Ya ayyuha allatheena amanoo ittaqoo Allaha waqooloo qawlan sadeedan.',
  'O you who have believed, fear Allah and speak words of appropriate justice.',
  'Surah Al-Ahzab 33:70',
  'Whoever believes in Allah and the Last Day should speak good or remain silent.',
  'Sahih al-Bukhari 6018; Sahih Muslim 47',
  '["What kind of speech do you want to reduce or increase this week?"]'::jsonb,
  'published',
  false
),
(
  'Prayer as Return',
  'Salah',
  'Salah is the repeated return of the servant to Allah. It interrupts distraction and reminds the heart where it belongs.

Presence in prayer grows gently. Choose one prayer this week and protect it with a little more preparation, calm, and attention.',
  'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
  'Inna assalata tanha AAani alfahshai walmunkar.',
  'Indeed, prayer prohibits immorality and wrongdoing.',
  'Surah Al-Ankabut 29:45',
  'The first matter that the servant will be brought to account for on the Day of Resurrection is the prayer.',
  'Jami at-Tirmidhi 413',
  '["What is one small way to bring more presence into one prayer each day?"]'::jsonb,
  'published',
  false
),
(
  'Trust After Effort',
  'Tawakkul',
  'Tawakkul is not passivity. It is doing what is responsible, then releasing the heart from believing it controls the outcome.

The believer plans, asks for help, makes dua, and acts. Then the believer entrusts what they cannot control to the One who knows and provides.',
  'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
  'Wa man yatawakkal AAala Allahi fahuwa hasbuh.',
  'And whoever relies upon Allah, then He is sufficient for him.',
  'Surah At-Talaq 65:3',
  'Tie it and rely upon Allah.',
  'Jami at-Tirmidhi 2517',
  '["Where do you need to act responsibly, then release the outcome to Allah?"]'::jsonb,
  'published',
  false
),
(
  'Mercy in Conflict',
  'Conflict',
  'Conflict reveals what the ego wants. Sometimes it wants to win more than it wants truth, repair, or mercy.

Islam does not ask us to erase harm or avoid hard conversations. It asks us to carry truth with restraint, justice, and a heart that still hopes for what is better.',
  'وَجَزَاءُ سَيِّئَةٍ سَيِّئَةٌ مِّثْلُهَا ۖ فَمَنْ عَفَا وَأَصْلَحَ فَأَجْرُهُ عَلَى اللَّهِ',
  'Wajazao sayyiatin sayyiatun mithluha faman AAafa waaslaha faajruhu AAala Allah.',
  'The recompense of an evil is an evil like it, but whoever pardons and makes reconciliation, his reward is with Allah.',
  'Surah Ash-Shura 42:40',
  'The strong person is not the one who overcomes people by wrestling, but the strong person is the one who controls himself when angry.',
  'Sahih al-Bukhari 6114; Sahih Muslim 2609',
  '["How can you bring mercy into one tension in your life without abandoning truth?"]'::jsonb,
  'published',
  false
),
(
  'Quran as Companion',
  'Quran',
  'The Quran is guidance, healing, warning, and mercy. A relationship with it can begin again through recitation, listening, memorization, or reflection.

Do not wait for a perfect routine. Choose a small, sincere point of contact with the Quran and protect it.',
  'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
  'Wanunazzilu mina alqurani ma huwa shifaon warahmatun lilmu/mineen.',
  'And We send down of the Quran that which is healing and mercy for the believers.',
  'Surah Al-Isra 17:82',
  'The best of you are those who learn the Quran and teach it.',
  'Sahih al-Bukhari 5027',
  '["What small Quran practice can you protect this week?"]'::jsonb,
  'published',
  false
),
(
  'Remembering Allah Often',
  'Dhikr',
  'Dhikr returns the heart to its center. It can be woven into transitions: waking, commuting, waiting, cooking, walking, and resting.

The goal is not performance. The goal is remembrance that softens attention and makes Allah less absent from ordinary moments.',
  'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا',
  'Ya ayyuha allatheena amanoo othkuroo Allaha thikran katheeran.',
  'O you who have believed, remember Allah with much remembrance.',
  'Surah Al-Ahzab 33:41',
  'Keep your tongue moist with the remembrance of Allah.',
  'Jami at-Tirmidhi 3375',
  '["What moment in your day can become a cue for dhikr?"]'::jsonb,
  'published',
  false
);

