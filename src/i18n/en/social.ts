import type { Catalog } from '../format';

export const social = {
  big_game_fan:
    'i have watched {surname} three times and i have never seen a defender look so lonely',
  big_game_analyst:
    '{player} tonight: efficient, patient, never forced it. The tape will look even better than the box score.',
  big_game_hometown:
    'The whole street watched. Mrs Petrosyan from number 14 says she always knew. She did not always know.',
  big_game_parody: 'BREAKING: Local rim files restraining order against {surname}.',
  bad_game_hater:
    '{surname} shot like he was trying to hit the scoreboard. Maybe next time aim for the basket??',
  bad_game_fan: 'off night for {surname}. it happens. we go again',
  bad_game_analyst: 'Rough one for {player}. The shot selection was the problem, not the shot.',
  winner_fan: 'I AM STANDING ON A CHAIR. {surname}!!!!!!!!',
  winner_journalist:
    'Tie game, clock running, ball in {player}’s hands. That was not luck. That was a plan.',
  winner_teammate:
    'told everybody in the huddle he was hitting it. nobody believed me. believe me now',
  clutch_miss_hater:
    'imagine having the game in your hands and doing THAT with it. {surname} please',
  win_fan: 'W. {team} keep stacking them',
  win_hometown:
    'Another win for our boy {surname}. The café on the square has started showing the games.',
  win_parody: 'Scientists confirm {team} won again. More at eleven.',
  loss_fan: 'tough one. still riding with {surname}',
  loss_hater: '{team} lose again and {surname} still thinks he is the guy',
  loss_analyst: '{team} lost the rebounding battle by double digits. That is the story.',
  upset_analyst: 'Nobody had {team} winning that one. {player} did not read the previews.',
  upset_fan: 'WHO PICKED AGAINST US. NAME YOURSELVES.',
  injury_fan: 'get well soon {surname}, we need you back out there',
  injury_hater: 'soft. {surname} is soft. there i said it',
  commit_hometown:
    'Our {surname} is going to college in America! The bakery is giving out free bread this morning.',
  commit_analyst:
    '{player} commits. Interesting fit. Lots of shots available. We will see what he does with them.',
  callup_hometown:
    '{surname} in the national team jersey. Grandparents across the country are crying, and so am I.',
  callup_journalist:
    '{player} gets the call-up. Selectors pick on ability alone, and they picked him.',
  declare_analyst:
    '{player} declares. First-round talent on his best nights; the question is how many of those nights there are.',
  declare_hater: '{surname} entering the draft is the funniest thing that has happened this year',
  drafted_hometown:
    'They called his name! {surname}! The whole town is outside. Somebody brought a trumpet.',
  drafted_brand: 'Welcome to the league, {surname}. We have some shoes we would like you to see.',
  drafted_rival: 'congrats {surname}. see you on the court. for real this time',
  undrafted_fan: 'undrafted means nothing. half the league went undrafted. keep going {surname}',
  undrafted_hater: 'sixty picks and not one team wanted {surname}. let that sink in',
  rival_big_game_rival: 'some of us do it on the big stage. just saying',
  rival_big_game_analyst:
    '{rival} was outstanding tonight. The comparisons with {surname} will only get louder.',
  big_game_shooter_fan:
    'every time {surname} caught it in the corner my dad stood up before the shot. he was right every time',
  big_game_big_fan:
    '{surname} owned the paint so completely they should start charging the other team rent',
  big_game_slasher_fan:
    'nobody in this building has stayed in front of {surname} tonight. that includes security',
  big_game_playmaker_analyst:
    '{player} ran the offence like he had the other bench’s playbook in his pocket. Four of his assists came before the defence had finished rotating.',
  big_game_defender_analyst:
    'Watch {player} away from the ball. He blew up three actions before they started, and none of that is on the stat sheet.',
  big_game_teammate: 'feed him. that’s the scouting report. feed {surname}',
  big_game_journalist:
    '{player} was the best player on the floor by a distance. I asked him about it afterwards and he talked about his screeners for two minutes.',
  big_game_hater: 'one good game against a team that cannot guard a lamppost. relax',
  big_game_brand: 'Big night for {surname}. Our socks were there for every minute of it.',
  big_game_grandfather:
    'Old Mr {surname} watched on a neighbour’s phone through the fence and would not give the phone back.',
  big_game_parody_weather:
    'WEATHER: Heavy buckets in the area tonight. {surname} advised to stay indoors. He will not.',
  big_game_hot_fan:
    'that’s three in a row for {surname}. i am not saying it any louder in case it hears me',
  big_game_rival: 'nice game. see you soon',
  big_game_bench_fan: 'how is {surname} not starting. genuinely asking. i have drawn a diagram',
  bad_game_hater_shooter:
    'i have seen {surname} miss from places i did not know you could miss from',
  bad_game_hater_turnovers: '{surname} had more turnovers tonight than the bakery on my street',
  bad_game_fan_patient:
    'bad games are allowed. {surname} has given us enough good ones. see you thursday',
  bad_game_analyst_tired:
    '{player} looked a step slow all night. Legs, not skill. Worth watching how his minutes are managed this week.',
  bad_game_parody: 'BREAKING: Search party organised for {surname}’s jump shot. Last seen Tuesday.',
  bad_game_hometown:
    'They showed the game at the community hall. Halfway through the second half somebody switched to the football. Nobody complained.',
  bad_game_teammate: 'my guy. we go again tomorrow. i’ll rebound for you at 7',
  bad_game_hater_slump:
    '{surname} slump watch, day whatever. i have stopped counting. so has he, mostly the points',
  bad_game_journalist:
    'Not {player}’s night. He stayed at his locker and answered every question, which is more than some do after nights like that.',
  bad_game_star_fan:
    'when {surname} has a night like this we lose. that is the whole problem and the whole compliment',
  bad_game_hater_hype:
    'all that hype and {surname} disappears the moment anybody important is watching. classic',
  bad_game_analyst_help:
    'Credit the defence on {player}: help came from the corner every time he turned middle. He will need an answer before next week.',
  winner_hometown:
    'Church bells rang at midnight in {surname}’s hometown. The priest says it was a coincidence. It was not a coincidence.',
  winner_parody:
    'Local man {surname} reportedly "did it again". Opponents reportedly "saw it coming" and "could not stop it anyway".',
  winner_analyst:
    'Watch {player}’s feet on the last shot. Same footwork as in the first minute. That is why it went in.',
  winner_hater: 'lucky. that shot was lucky. i have watched it nine times and it is still lucky',
  winner_rival: 'ok. that was cold.',
  winner_brand: 'Ice in the veins. Ice in our coolers too. Congratulations, {surname}.',
  winner_clutch_fan: 'never in doubt. it was in doubt for me personally but never for {surname}',
  winner_march_journalist:
    'March has a new name in it. {player} with the shot that ended somebody’s season.',
  winner_towel_teammate:
    'i was on the bench holding a towel and i have never held a towel this hard in my life',
  clutch_miss_fan: 'he wanted the shot. that is the part that matters. next time {surname}',
  clutch_miss_analyst: 'The look {player} got was a good one. Sometimes the right shot misses.',
  clutch_miss_parody: 'Rim confirms it "had a quiet word" with {surname}’s last shot.',
  clutch_miss_hater_yips:
    'the moment the clock gets under ten {surname} turns into a different, worse player',
  win_teammate: 'bus ride home is going to be loud. sorry in advance to the driver',
  win_analyst:
    '{team} keep winning the boring way: rebounds, free throws, no late turnovers. Boring wins count the same.',
  win_barber:
    'Another win. The barber on our street now asks about {surname} before he asks what cut you want.',
  win_road_fan:
    'road win!! the home crowd left with four minutes to go and i will remember every one of their faces',
  win_journalist:
    '{team} get the win. {player} was part of it in all the ways that never make the highlights.',
  win_star_fan: 'when {surname} plays like that {team} do not lose. simple maths',
  win_towel_fan:
    'saw {surname} waving a towel at the end of the bench and honestly it was the best towel work in the conference',
  win_hater: 'wins against nobody. call me when {team} play somebody',
  win_parody_hot:
    'Doctors baffled as {surname} remains "on fire" for a third straight game. Fire brigade on standby.',
  win_brand: 'A win is a win. A {surname} win is one you can wear. Link in bio.',
  win_conference_fan: 'conference wins hit different. we are coming for the top of the table',
  win_showcase_hometown:
    'The showcase was streamed on a laptop in the school library. The librarian allowed cheering for the first time in her career.',
  loss_teammate: 'on us. film at 8, we fix it',
  loss_close_fan: 'lost by a bucket and i will be thinking about one charge call until i die',
  loss_hometown:
    'A loss tonight, but our {surname} played every minute as if it mattered. His grandmother says the referee needs glasses.',
  loss_parody:
    '{team} lose. Experts recommend "scoring more points than the other team" going forward.',
  loss_journalist:
    '{team} were outscored in the last five minutes again. At some point that stops being bad luck.',
  loss_conference_fan: 'every conference loss costs us seeding. i have a spreadsheet. i am fine',
  loss_hater_slump: '{surname} in this slump is the gift that keeps on giving (to the other team)',
  loss_analyst_rotation:
    '{team} gave up too many corner threes. The rotation was half a second late all night.',
  loss_bench_fan: 'put {surname} in. what is there to lose. we already lost',
  loss_gym_video_hater:
    '{team} lose and {surname} posts a gym video an hour later. the gym is not the problem bro',
  loss_showcase_hometown:
    'The showcase did not go our way. Our {surname} still looked like he belonged with the best in the country. He does.',
  upset_journalist: 'An upset by any measure. The visiting coach shook hands without looking up.',
  upset_hater: 'they let {team} win that one so they could feel something',
  upset_parody: 'Bookmakers in shock. One bookmaker described as "lying down".',
  upset_teammate: 'they put us on the schedule as a warm-up. warm enough for you?',
  upset_hometown:
    'They are dancing in the square. Nobody here knows the other team, but the radio said they were famous.',
  upset_rival: 'lucky night for {team}. enjoy it',
  injury_teammate:
    'get well bro. we will hold your spot. not literally, coach says somebody has to play',
  injury_hometown:
    'Our {surname} is hurt. His mother has asked everyone to stop calling her for updates. Please stop calling her.',
  injury_analyst: 'Losing {player} changes how {team} defend. Expect more zone until he is back.',
  injury_journalist:
    'The team says {player} is day to day. In my experience, day to day means nobody knows yet.',
  injury_parody: 'Ice pack industry reports record quarter after {surname} news.',
  injury_iron_fan:
    'if {surname} is sitting out it must be bad. he once finished a game with one shoe',
  injury_prone_hater:
    '{surname} is built from the same material as the folding chairs at a wedding',
  commit_fan:
    'new guy just committed and i have already bought the jersey. it is the wrong number. i will wait',
  commit_hater: 'that school? with that roster? he will be on the bench until he is thirty',
  commit_journalist:
    '{player} has committed. He told me the deciding factor was "the coach’s handwriting". I did not follow up.',
  commit_parody:
    'Sources: {surname} has committed. Other sources: several college coaches are now staring out of windows.',
  commit_rival: 'congrats. hope they have a big bench',
  callup_fan: 'our guy in the national team!!! the flag is going on the balcony',
  callup_analyst:
    '{player} is young for this squad. The selectors seem to think that is the point.',
  callup_hater: 'call-up for {surname} tells you everything about how thin the pool is',
  callup_small_nation:
    'The whole country would fit in one arena, and tonight every one of us knows {surname}’s name.',
  callup_teammate: 'my teammate is on the national team. i am telling everyone at the airport',
  draft_rise_analyst:
    '{player} is climbing boards. Three teams picking in the late teens have asked for more film.',
  draft_rise_fan:
    'the mock drafts are finally catching up to what we have been saying for two years',
  draft_rise_parody: 'Mock drafter moves {surname} up four spots "out of fear".',
  draft_fall_analyst:
    '{player} has slipped in the latest mocks. The shot is the question, and the workouts have not answered it.',
  draft_fall_hater: 'the mock drafts have finally started watching {surname} play',
  draft_fall_fan:
    'mock drafts are written by people who have never been in a gym. we know what {surname} is',
  quiet_week_fan:
    'week off and i keep checking {surname}’s page like he is going to post a highlight from the library',
  quiet_week_parody: 'Nothing happened to {surname} this week. Sources describe it as "nice".',
  quiet_week_hometown: 'No game this week. The café played last month’s highlights instead. Twice.',
  rival_big_game_fan:
    '{rival} scored a lot tonight. {surname} would have scored more, not that anybody asked',
  rival_big_game_hater:
    '{rival} doing it on the big stage while {surname} does it in front of his roommate',
  rival_big_game_journalist:
    '{rival} scored at will tonight. I will be watching how {player} answers.',
  rival_big_game_parody:
    'The {surname}–{rival} thing is now officially "a whole thing", say sources.',
  rival_big_game_rival_ask: 'ask around about tonight',
  declare_fan: 'going to miss {surname} in our colours. go get it',
  declare_hometown:
    'Our {surname} is entering the draft. The mayor has said something about it, at length.',
  declare_journalist:
    '{player} declares. He told me he decided on a walk round campus at two in the morning, which is when most decisions get made.',
  declare_teammate: 'proud of you bro. leave me your parking space',
  declare_parody:
    'BREAKING: {surname} declares for the draft. Scouts nationwide reportedly "sharpening pencils".',
  drafted_analyst:
    '{player} goes about where he should. Good fit, fair value, and a long summer of learning a new playbook.',
  drafted_journalist:
    'I first wrote about {player} when nobody else was. Tonight everybody was. Well done.',
  drafted_fan: 'WE KNEW. WE ALWAYS KNEW. (we were very nervous)',
  drafted_teammate:
    'my teammate is a professional basketball player. i remain a professional at sitting next to him on buses',
  drafted_parody:
    '{surname} drafted. Celebrations expected to continue until somebody’s mother says it is time to go home.',
  drafted_hater: 'reach. massive reach. talk to me in two years',
  undrafted_hometown:
    'No name called tonight. Our {surname} is still the best player this town has ever made, and summer league is a door.',
  undrafted_analyst:
    'Undrafted is a route, not a verdict. Expect {player} to have summer league calls by the morning.',
  undrafted_teammate: 'their loss. call me when you need a rebounder at 6am',
  undrafted_rival: 'tough night. keep going',
  event_documentary:
    'just watched episode three and {surname} stared out of that window like it owed him money',
  event_fan_letter:
    'my daughter wrote {surname} a letter and he came to her SCHOOL. i am not crying, the assembly hall is dusty',
  event_old_posts:
    '{surname} standing by his cereal takes is the most honest thing an athlete has said all year',
  event_feud: 'Graphic designers "thrilled" as {surname} and {rival} agree to keep glaring.',
  event_viral_dunk:
    'watched {surname} jump off a trampoline forty times. i have work tomorrow. no regrets',
  event_tyre_ad:
    '{surname}’s tyre commercial is now the most-watched video in the athletic department. Nobody can agree what the slogan is.',
  event_rival_reply: 'cute highlight. check the rankings again',
  event_rival_classy:
    '{player} answered {rival}’s podcast clip with "good luck to him". Somewhere a publicist is weeping with joy.',
  event_captain: 'captain {surname}. pizza-box ballots do not lie',
  event_mattress:
    '{surname} spotted lying on a mattress at a store opening. Sources confirm it was "for work".',
  event_coin: '{surname} promoting a cartoon dog coin. this is fine. everything is fine',
  event_podcast:
    'the {surname} episode of the dorm podcast has everything. tactics, swimming lessons, a sandwich review',
  event_hometown_photo:
    'That is our court in the paper! The rim in that photo taught three generations to shoot slightly left.',
  event_backed_coach:
    '{player} on his coach: "I play for him and nobody else." Not everyone in that building would say the same this week.',
  event_kind_post: '{surname} posting about {rival}’s injury like that. class',
  event_freshman_song:
    '{surname} sang a song from home at freshman dinner and we have been humming it for three hours. send the lyrics',
} satisfies Catalog;
