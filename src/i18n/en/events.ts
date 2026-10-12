import type { Catalog } from '../format';

export const events = {
  campus_visits: {
    title: 'Official visits',
    body: 'Two campuses want you this weekend. One has a practice facility with a waterfall. The other has a coach who wrote your mother a handwritten letter.',
    choices: {
      big_program: {
        label: 'See the big programme',
        outcome:
          'The waterfall is real. So is the depth chart: four guards, all of them bigger than you.',
        timeline: 'Visited a big programme.',
      },
      small_school: {
        label: 'See the small school',
        outcome:
          'The coach drew your name into every play on the whiteboard. You left feeling ten feet tall.',
        timeline: 'Visited a small school.',
      },
      skip_and_train: {
        label: 'Skip both, get shots up',
        outcome: 'Five hundred makes on a Saturday. Both coaches texted. You replied on Monday.',
        timeline: 'Skipped visits to train.',
      },
    },
  },
  teammate_party: {
    title: 'House party',
    body: '{teammate} is throwing a party on Thursday. Practice is at seven on Friday. Half the team is going and the other half is pretending they are not.',
    choices: {
      go_big: {
        label: 'Go, and stay late',
        outcome: 'Best night of the semester. Friday practice was the worst morning of it.',
        timeline: 'Went to the party and stayed late.',
      },
      cameo: {
        label: 'Show up for an hour',
        outcome: 'One soda, three photos, home by eleven. Everyone saw you there.',
        timeline: 'Made a short appearance at the party.',
      },
      stay_in: {
        label: 'Stay in',
        outcome: 'Eight hours of sleep and a group chat you will not be able to follow on Monday.',
        timeline: 'Skipped the party.',
      },
    },
  },
  coach_heard_about_party: {
    title: 'A word in the office',
    body: '{coach} has heard about the party. He has not decided how much he cares yet. He is waiting to see what you say first.',
    choices: {
      own_it: {
        label: 'Own it',
        outcome: 'He nodded for a long time. "Fine. Don’t make me hear about the next one."',
        timeline: 'Owned up to the party.',
      },
      blame_teammate: {
        label: 'Say it was {teammate}’s idea',
        outcome: 'He wrote something down. Word travels in a locker room.',
        timeline: 'Blamed a teammate for the party.',
      },
      offer_film: {
        label: 'Offer extra film sessions',
        outcome: '"Six a.m., Tuesday and Thursday." He almost smiled.',
        timeline: 'Turned the party into extra film work.',
      },
    },
  },
  tutor_offer: {
    title: 'The academic adviser',
    body: 'Your grades are drifting towards ineligible. The adviser has a tutor’s number and a teammate has a folder of last year’s answers.',
    choices: {
      hire_tutor: {
        label: 'Pay for the tutor',
        outcome:
          'Three evenings a week with a graduate student who finds statistics thrilling. It is working.',
        timeline: 'Hired a tutor.',
      },
      copy_homework: {
        label: 'Borrow the folder',
        outcome: 'Grades up, overnight. The answers were suspiciously good.',
        timeline: 'Copied last year’s answers.',
      },
      wing_it: {
        label: 'Wing it',
        outcome: 'You have decided to believe in yourself. The syllabus has not.',
        timeline: 'Ignored the warning about grades.',
      },
    },
  },
  beat_writer_interview: {
    title: 'Ten minutes with the paper',
    body: '{journalist} wants ten minutes for a long piece about your season. Long pieces have a way of including the parts you did not mean to say.',
    choices: {
      open_up: {
        label: 'Open up',
        outcome:
          'You talked about home, the move, the pressure. It might be the best thing written about you yet.',
        timeline: 'Gave the beat writer a long interview.',
      },
      cliches: {
        label: 'One game at a time',
        outcome:
          'You said "one game at a time" four times. The piece ran with a photo instead of quotes.',
        timeline: 'Gave a cliché-only interview.',
      },
      decline: {
        label: 'Decline',
        outcome:
          'You said you were tired. They wrote the piece anyway, about the guy who said he was tired.',
        timeline: 'Declined an interview.',
      },
    },
  },
  minutes_talk: {
    title: 'Minutes',
    body: 'You have been stuck behind the same players for weeks. {coach}’s door is open, which is either an invitation or a test.',
    choices: {
      ask_for_minutes: {
        label: 'Ask for more minutes',
        outcome:
          'He listened all the way through. What he heard depended on how much he already trusted you.',
        timeline: 'Asked the coach for more minutes.',
      },
      work_quietly: {
        label: 'Keep working quietly',
        outcome:
          'You said nothing and stayed after practice. He noticed. Your confidence did not get the memo.',
        timeline: 'Kept working without complaint.',
      },
      threaten_transfer: {
        label: 'Mention the transfer portal',
        outcome: 'The temperature in the room dropped several degrees.',
        timeline: 'Threatened to transfer.',
      },
    },
  },
  local_sponsor: {
    title: 'A local endorsement',
    body: 'A tyre shop near campus wants you in a commercial. There is a slogan. It rhymes with your surname, mostly.',
    choices: {
      sign: {
        label: 'Sign it',
        outcome:
          'You said the slogan nine times. The cheque cleared. The team group chat will never let it go.',
        timeline: 'Signed a local endorsement.',
      },
      negotiate: {
        label: 'Negotiate',
        outcome:
          'You asked for more. Whether they paid it depended on how famous you already were.',
        timeline: 'Negotiated an endorsement.',
      },
      decline: {
        label: 'Decline',
        outcome: 'No slogan. Coach appreciated the focus.',
        timeline: 'Turned down an endorsement.',
      },
    },
  },
  rival_trash_talk: {
    title: '{rival} has something to say',
    body: 'In a podcast clip that is doing numbers, {rival} says you are "a system player in a small system". The clip is on your phone four times already.',
    choices: {
      fire_back: {
        label: 'Fire back',
        outcome:
          'Your reply was short and devastating. The internet chose sides. It is personal now.',
        timeline: 'Started a public feud with the rival.',
      },
      stay_classy: {
        label: 'Wish him well',
        outcome: '"Good luck to him." Nothing is more annoying, and everybody knows it.',
        timeline: 'Took the high road with the rival.',
      },
      let_it_ride: {
        label: 'Say nothing',
        outcome: 'You screenshotted it and set it as your lock screen.',
        timeline: 'Let the rival’s comments slide.',
      },
    },
  },
  homesick: {
    title: 'Homesick',
    body: 'It has been eleven weeks. The food is wrong, the weather is wrong, and nobody here pronounces your name the way your grandmother does.',
    choices: {
      call_home: {
        label: 'Call home',
        outcome: 'Two hours on the phone. Everyone shouted at once. It helped.',
        timeline: 'Called home when homesick.',
      },
      fly_home: {
        label: 'Fly home for the weekend',
        outcome: 'Your own bed. Your mother’s cooking. A missed Saturday walkthrough.',
        timeline: 'Flew home for a weekend.',
      },
      push_through: {
        label: 'Push through',
        outcome: 'You decided not to feel it. It decided otherwise.',
        timeline: 'Pushed through homesickness alone.',
      },
      lean_on_teammates: {
        label: 'Lean on the team',
        outcome:
          'Somebody cooked. Somebody brought cards. Somebody tried to pronounce your name and nearly managed.',
        timeline: 'Leaned on teammates when homesick.',
      },
    },
  },
  dawn_shooting: {
    title: 'Six a.m.',
    body: '{coach}’s assistant runs shooting sessions at six in the morning. Nobody has to come. The people who come get better.',
    choices: {
      all_in: {
        label: 'Every day',
        outcome: 'Your alarm hates you. Your release has never been quicker.',
        timeline: 'Joined the dawn shooting sessions.',
      },
      some_days: {
        label: 'Twice a week',
        outcome: 'Enough to see a difference, not enough to resent it.',
        timeline: 'Joined some dawn sessions.',
      },
      sleep_in: {
        label: 'Sleep',
        outcome: 'You heard about it at lunch. You slept well, though.',
        timeline: 'Skipped the dawn sessions.',
      },
    },
  },
  sore_knee: {
    title: 'The knee',
    body: 'Your left knee has been talking to you on the stairs. It has opinions about landing.',
    choices: {
      see_trainer: {
        label: 'See the trainer',
        outcome: 'Ice, tape and a long look. The trainer is not worried. Yet.',
        timeline: 'Had the knee checked.',
      },
      ice_it: {
        label: 'Ice it and keep going',
        outcome: 'Ice, ibuprofen, denial. It feels fine. Mostly.',
        timeline: 'Kept playing on a sore knee.',
      },
      painkillers: {
        label: 'Painkillers before games',
        outcome: 'You cannot feel it at all now, which is not the same as it being fine.',
        timeline: 'Played on painkillers.',
      },
    },
  },
  viral_dunk: {
    title: 'The challenge',
    body: 'A fan account wants you to try the between-the-legs reverse from a trampoline video. It would be enormous. It would also be a trampoline.',
    choices: {
      do_it: {
        label: 'Do it',
        outcome:
          'Eleven million views. You landed it on the fourth try. Your ankle remembers the first three.',
        timeline: 'Did the viral dunk challenge.',
      },
      decline: {
        label: 'Pass',
        outcome:
          'You posted a picture of the trampoline with a skull emoji. People liked that too.',
        timeline: 'Passed on the dunk challenge.',
      },
    },
  },
  scouts_in_stands: {
    title: 'Scouts behind the bench',
    body: 'Three pro scouts are in the second row tonight. Everyone on your team knows. Some of your teammates want to be seen too.',
    choices: {
      play_your_game: {
        label: 'Play your game',
        outcome: 'You played the way you always do. That was the point.',
        timeline: 'Ignored the scouts and played normally.',
      },
      hunt_shots: {
        label: 'Show them what you can do',
        outcome: 'You took eighteen shots. Your point guard took four. He has not forgotten.',
        timeline: 'Hunted shots in front of scouts.',
      },
      ask_coach: {
        label: 'Ask coach what they look for',
        outcome: '"Defence and decisions." He drew you a list.',
        timeline: 'Asked the coach about scouts.',
      },
    },
  },
  federation_letter: {
    title: 'A letter from home',
    body: 'Your national federation writes: they are building the next team around a few young players and would like you to be one of them.',
    choices: {
      commit: {
        label: 'Commit',
        outcome: 'The federation posted your reply. Your hometown newspaper printed it twice.',
        timeline: 'Committed to the national team.',
      },
      maybe_later: {
        label: 'Ask for time',
        outcome: 'They said they understood. They said it carefully.',
        timeline: 'Asked the national team for time.',
      },
      say_no: {
        label: 'Decline',
        outcome:
          'You explained about your body, your schedule, your future. Back home they heard one word.',
        timeline: 'Declined the national federation.',
      },
    },
  },
  envelope: {
    title: 'An envelope',
    body: 'A man who says he is "a friend of the programme" leaves an envelope in your locker. It is thick. There is no note.',
    choices: {
      take_it: {
        label: 'Keep it',
        outcome:
          'Five thousand dollars in twenties. You moved it three times before you could sleep.',
        timeline: 'Kept the envelope of cash.',
      },
      report_it: {
        label: 'Take it to compliance',
        outcome: 'The compliance office thanked you in a tone you have never heard from an office.',
        timeline: 'Reported the envelope.',
      },
      walk_away: {
        label: 'Leave it there',
        outcome: 'You left it on the shelf. The next day it was gone.',
        timeline: 'Left the envelope alone.',
      },
    },
  },
  slump_film: {
    title: 'Film room',
    body: '{coach} has cut every shot you have missed this month into one long video. He wants to watch it with you. Tonight.',
    choices: {
      stay_late: {
        label: 'Stay and watch',
        outcome:
          'Your feet were wrong on all of them. Every single one. You feel better than you have in weeks.',
        timeline: 'Watched slump film with the coach.',
      },
      skip_it: {
        label: 'Skip it',
        outcome: 'You told him you needed rest. He told you he would remember that.',
        timeline: 'Skipped slump film.',
      },
    },
  },
  roommate: {
    title: 'The roommate',
    body: '{teammate} plays drill music at two in the morning and borrows your shoes without asking. He is also your backup.',
    choices: {
      talk_it_out: {
        label: 'Talk it out',
        outcome:
          'A long, awkward conversation. Now you have a schedule for the speaker and a shoe rule.',
        timeline: 'Worked things out with the roommate.',
      },
      switch_rooms: {
        label: 'Switch rooms',
        outcome: 'New room, new silence. He took it a little personally.',
        timeline: 'Switched rooms.',
      },
      headphones: {
        label: 'Buy earplugs',
        outcome: 'Problem solved, technically. The shoes are still going missing.',
        timeline: 'Ignored the roommate problem.',
      },
    },
  },
  mock_draft_slide: {
    title: 'The mock drafts',
    body: 'Three mock drafts this week. In each one you are a few picks later than the week before.',
    choices: {
      tune_out: {
        label: 'Stop reading them',
        outcome: 'You deleted the apps. You reinstalled one. You deleted it again.',
        timeline: 'Tuned out the mock drafts.',
      },
      call_agent: {
        label: 'Call your agent',
        outcome: 'Your agent made calls you were not told about. The next mock had you climbing.',
        timeline: 'Had the agent push back on the mocks.',
      },
      extra_workouts: {
        label: 'Answer in the gym',
        outcome: 'Two-a-days. Your legs are heavy and your vertical is up an inch.',
        timeline: 'Added extra workouts before the draft.',
      },
    },
  },
  prom_or_camp: {
    title: 'Prom weekend',
    body: 'Prom is on Saturday. So is the last day of an invitation-only camp four hours away. Your date has already bought flowers to match your tie, which you have not bought yet.',
    choices: {
      prom: {
        label: 'Go to prom',
        outcome: 'You danced badly and on purpose. Your aunt took forty photos and framed two.',
        timeline: 'Went to prom.',
      },
      elite_camp: {
        label: 'Go to the camp',
        outcome:
          'Three days of drills with players who were each the best on their own team. You were not the best at this one. You learned more.',
        timeline: 'Skipped prom for an elite camp.',
      },
      both: {
        label: 'Do both',
        outcome:
          'Prom until midnight, four hours in the car, check-in at six. You played the morning session with glitter in your hair.',
        timeline: 'Drove overnight from prom to camp.',
      },
    },
  },
  hs_coach_keys: {
    title: 'The gym key',
    body: 'Your high-school coach hands you a key on a shoelace. "Summer hours are whenever you want them. Lock up. Do not touch the thermostat."',
    choices: {
      take_the_key: {
        label: 'Take the key',
        outcome:
          'You were there at six most mornings. The thermostat stayed exactly where he left it.',
        timeline: 'Spent the summer in the old gym.',
      },
      thank_him: {
        label: 'Thank him properly',
        outcome:
          'You wrote him a letter. He pinned it next to the trophy case, where the whole school read it, and told the janitor it was "a decent effort".',
        timeline: 'Thanked the high-school coach.',
      },
      hand_it_back: {
        label: 'Hand it back',
        outcome:
          'You said you needed a summer off. He nodded and hung the key back on its hook, where it will stay.',
        timeline: 'Turned down the old gym key.',
      },
    },
  },
  graduation_speech: {
    title: 'Commencement',
    body: 'The principal wants a student athlete to speak at graduation. Three minutes, twelve hundred folding chairs. Your grandmother has already claimed a seat in the front row.',
    choices: {
      give_speech: {
        label: 'Write a real speech',
        outcome:
          'You talked about the leaning rim at the park and the people who drove you to games. Your voice did what it wanted. Your family cried regardless.',
        timeline: 'Spoke at graduation.',
      },
      keep_it_short: {
        label: 'Ninety seconds, then sit down',
        outcome:
          'You thanked your teachers, your family and the bus driver. The bus driver got the biggest cheer.',
        timeline: 'Gave a short graduation speech.',
      },
      decline: {
        label: 'Let someone else speak',
        outcome:
          'The class president spoke for a quarter of an hour. Your grandmother asked, audibly, why it was not you.',
        timeline: 'Declined to speak at graduation.',
      },
    },
  },
  summer_job: {
    title: 'Summer money',
    body: 'College starts in July and your bank balance is mostly decimal places. Your uncle’s moving company needs someone who can carry a sofa up a staircase, and the youth league needs coaches.',
    choices: {
      moving_company: {
        label: 'Carry sofas for your uncle',
        outcome:
          'Nine hundred dollars and forearms like bread loaves. You now know every narrow staircase in the city.',
        timeline: 'Worked for a moving company.',
      },
      kids_camp: {
        label: 'Coach the eight-year-olds',
        outcome:
          'Twenty children, one ball each, no listening. On the last day they made you a card with your number wrong.',
        timeline: 'Coached a youth camp.',
      },
      train_all_summer: {
        label: 'No job. Just training.',
        outcome:
          'You spent your savings on gym fees and petrol. Your left hand finally does what it is told.',
        timeline: 'Trained instead of working.',
      },
      run_the_old_gym: {
        label: 'Run open gym with the old key',
        outcome:
          'Your old coach paid you to supervise open gym. You supervised mostly by shooting.',
        timeline: 'Ran open gym at the old school.',
      },
    },
  },
  rival_ranking_post: {
    title: 'The rankings',
    body: '{rival} has posted the new senior rankings with his name circled and yours underlined twice, followed by a laughing face. Thirty-one people have commented "cooked".',
    choices: {
      reply: {
        label: 'Reply',
        outcome:
          'You posted your best highlight and a single word. By lunch the comments were a war.',
        timeline: 'Replied to the rival’s post.',
      },
      print_it: {
        label: 'Print it out',
        outcome: 'It is taped inside your locker now, at eye level. You see it every morning.',
        timeline: 'Kept the rival’s post as motivation.',
      },
      congratulate: {
        label: 'Congratulate him',
        outcome:
          '"Well deserved." He did not know what to do with that. Neither did his thirty-one commenters.',
        timeline: 'Congratulated the rival on his ranking.',
      },
    },
  },
  flip_call: {
    title: 'A late call',
    body: 'A coach from a bigger programme calls. His starting guard has just transferred. He says your commitment is "a conversation, not a contract".',
    choices: {
      stay_committed: {
        label: 'Say you are staying',
        outcome:
          'You told him you had given your word. Your future coach heard about the call by dinner and texted a thumbs-up.',
        timeline: 'Turned down a late offer.',
      },
      hear_him_out: {
        label: 'Hear him out',
        outcome:
          'Forty minutes on the phone. He said all the right things. You said "I will think about it", which travels further than you meant it to.',
        timeline: 'Listened to another programme’s pitch.',
      },
      hand_phone_to_mother: {
        label: 'Hand the phone to your mother',
        outcome:
          'She asked him four questions about class attendance. He thanked her for her time and has not called back.',
        timeline: 'Let his mother handle a recruiter.',
      },
    },
  },
  hometown_paper: {
    title: 'The local paper',
    body: '{journalist} is writing about local players going to college and wants a photo of you at the court where you learned. The rim there has no net and leans slightly to the left.',
    choices: {
      pose_at_court: {
        label: 'Pose under the old rim',
        outcome:
          'The photo ran above the fold. The city fixed the rim a week later. Nobody admits the two are related.',
        timeline: 'Posed for the local paper.',
      },
      bring_family: {
        label: 'Bring the family',
        outcome:
          'Your little cousin got into every shot. The caption spelled his name right and yours wrong.',
        timeline: 'Did the local paper photo with family.',
      },
      decline: {
        label: 'Decline',
        outcome: 'They used your yearbook picture. You have braces in it.',
        timeline: 'Declined the local paper.',
      },
    },
  },
  last_pickup_run: {
    title: 'One more run',
    body: 'Your friends from the park want one last game before you leave. Same court, same teams as when you were twelve, same argument about whether the crack in the concrete is out of bounds.',
    choices: {
      play_all_night: {
        label: 'Play until the lights go off',
        outcome:
          'The lights went off at ten. You played by phone torches until the batteries died. Nobody kept score and everybody remembers it.',
        timeline: 'Played one last night at the park.',
      },
      referee: {
        label: 'Referee it',
        outcome: 'You called fouls on everyone equally and were hated equally. It was perfect.',
        timeline: 'Refereed the last pickup game.',
      },
      skip_it: {
        label: 'Say you are too tired',
        outcome:
          'You stayed in. Somebody posted a video of the game. You have watched it more than once.',
        timeline: 'Skipped the last pickup game.',
      },
    },
  },
  conditioning_after_loss: {
    title: 'Cones on the baseline',
    body: '{coach} did not say much after the loss. This morning there are cones on the baseline and a bin at each end of the court.',
    choices: {
      lead_the_sprints: {
        label: 'Finish first, every time',
        outcome:
          'You won every sprint and lost your breakfast. By the end, teammates were finishing with you instead of behind you.',
        timeline: 'Led the punishment sprints.',
      },
      do_the_minimum: {
        label: 'Finish in the middle',
        outcome: 'Not first, not last, not noticed. Except by him.',
        timeline: 'Coasted through the punishment sprints.',
      },
      complain: {
        label: 'Say what everyone is thinking',
        outcome:
          'You said running does not fix rotations. The team agreed loudly in the locker room and silently in front of him.',
        timeline: 'Complained about the punishment sprints.',
      },
      take_the_blame: {
        label: 'Take the blame as captain',
        outcome:
          '"That one is on me." You ran an extra set alone. He stopped the drill halfway through it.',
        timeline: 'Took the blame for a loss as captain.',
      },
    },
  },
  coach_hot_seat: {
    title: 'The hot seat',
    body: 'Message boards say {coach} has six weeks to save his job. A booster was seen leaving the athletic director’s office looking pleased with himself.',
    choices: {
      back_him_publicly: {
        label: 'Back him in public',
        outcome:
          'You told the cameras you play for him and nobody else. He never mentioned it. He did start calling you by your first name.',
        timeline: 'Backed the coach publicly.',
      },
      stay_neutral: {
        label: 'No comment',
        outcome:
          '"That is above my pay grade." The reporters laughed. You do not have a pay grade.',
        timeline: 'Stayed out of the coaching rumours.',
      },
      check_the_portal: {
        label: 'Quietly check the portal',
        outcome:
          'You looked. Someone saw you look. In college basketball, looking is a sentence on its own.',
        timeline: 'Checked the transfer portal during the coaching rumours.',
      },
    },
  },
  coach_holiday_dinner: {
    title: 'Holiday dinner',
    body: '{coach} invites anyone not going home to his house for the holiday. His wife has made four pies and labelled them by difficulty.',
    choices: {
      go_to_dinner: {
        label: 'Go',
        outcome:
          'You attempted the hardest pie. He told a story about his first season that he has clearly told forty times, and it was still good.',
        timeline: 'Spent the holiday at the coach’s house.',
      },
      fly_home: {
        label: 'Fly home',
        outcome:
          'An expensive ticket, two days at home and one argument about whether you have lost weight.',
        timeline: 'Flew home for the holiday.',
      },
      call_from_the_porch: {
        label: 'Go, and call home from the porch',
        outcome:
          'Dinner inside, family on speaker outside. Your grandfather asked to say hello to the coach. It lasted twenty minutes.',
        timeline: 'Split the holiday between the coach and home.',
      },
    },
  },
  captain_vote: {
    title: 'Captains',
    body: 'Captains are chosen by the players. The ballots are torn pieces of a pizza box. Someone has already voted for the equipment manager.',
    choices: {
      campaign: {
        label: 'Ask for votes',
        outcome:
          'You asked everyone, one by one, at the water fountain. Most of them said yes to your face.',
        timeline: 'Ran for team captain.',
      },
      nominate_teammate: {
        label: 'Nominate a teammate',
        outcome:
          'You put forward the senior who never misses a lift. He won, and he knows who started it.',
        timeline: 'Nominated a teammate for captain.',
      },
      lead_by_example: {
        label: 'Say nothing and let them decide',
        outcome: 'You did not campaign. You won by nine pizza-box votes anyway.',
        timeline: 'Was voted team captain.',
      },
    },
  },
  locker_room_scuffle: {
    title: 'The box-out',
    body: '{teammate} and {starTeammate} are arguing about a box-out from Tuesday. It has stopped being about the box-out.',
    choices: {
      step_in: {
        label: 'Get between them',
        outcome:
          'You pushed them apart and caught an elbow meant for someone else. They both apologised to you, which is a start.',
        timeline: 'Broke up a locker-room fight.',
      },
      get_the_coach: {
        label: 'Get the coach',
        outcome:
          'He arrived in eight seconds. They both ran until dark. Neither has forgotten who opened the door.',
        timeline: 'Fetched the coach during a fight.',
      },
      stay_out: {
        label: 'Stay out of it',
        outcome: 'You tied your shoes very slowly. It ended on its own, badly.',
        timeline: 'Stayed out of a locker-room fight.',
      },
      captain_call: {
        label: 'Settle it as captain',
        outcome:
          '"Film room. Both of you. Now." You watched the box-out together. Both of them were wrong.',
        timeline: 'Settled a locker-room fight as captain.',
      },
    },
  },
  star_freezes_you_out: {
    title: 'No passes',
    body: '{starTeammate} has not passed you the ball in three games. You were open on most of those possessions. The film agrees with you.',
    choices: {
      talk_to_him: {
        label: 'Talk to him',
        outcome:
          'You caught him by the cold tub. He listened, which is not quite the same as agreeing.',
        timeline: 'Confronted the star about passing.',
      },
      tell_the_coach: {
        label: 'Tell the coach',
        outcome:
          'The coach said he would handle it. He handled it in front of everyone, which nobody enjoyed.',
        timeline: 'Complained to the coach about the star.',
      },
      cut_harder: {
        label: 'Cut harder, get open earlier',
        outcome:
          'You stopped waiting for the ball and started running to where it was going. He found you twice. You are counting both.',
        timeline: 'Worked harder to get open.',
      },
      set_screens_for_him: {
        label: 'Set screens for him until he notices',
        outcome:
          'You freed him four times in one half. On the fifth, he swung it back to you without looking.',
        timeline: 'Won the star over with screens.',
      },
    },
  },
  group_chat_screenshot: {
    title: 'The group chat',
    body: '{teammate} has posted an impression of the coach in the team group chat. It is very good. Somebody outside the team is about to see it.',
    choices: {
      delete_and_warn: {
        label: 'Get him to delete it',
        outcome:
          'Gone within a minute. Two people had already saved it, but they are on your side.',
        timeline: 'Got a teammate to delete a risky post.',
      },
      forward_to_coach: {
        label: 'Show the coach first',
        outcome:
          'The coach watched it to the end without moving his face. The team knew who had shown him by the afternoon.',
        timeline: 'Showed the coach a teammate’s video.',
      },
      say_nothing: {
        label: 'Leave it',
        outcome: 'You sent a laughing face and went to bed. It really was a very good impression.',
        timeline: 'Ignored the group-chat video.',
      },
    },
  },
  freshman_initiation: {
    title: 'Freshman song',
    body: 'Freshmen sing at the first team dinner. Nobody can say when the tradition started. The seniors are already holding spoons like microphones.',
    choices: {
      sing_badly: {
        label: 'Sing badly, with commitment',
        outcome:
          'You forgot the second verse and hummed it at full volume. The seniors gave you an eight.',
        timeline: 'Sang at the freshman dinner.',
      },
      sing_from_home: {
        label: 'Sing a song from home',
        outcome:
          'Half the room understood none of it. Everyone was clapping by the chorus. A senior asked for the lyrics.',
        timeline: 'Sang a song from home at the team dinner.',
      },
      refuse: {
        label: 'Refuse',
        outcome:
          'You said you do not sing. The seniors said "noted" in a way that will last until March.',
        timeline: 'Refused to sing at the freshman dinner.',
      },
    },
  },
  mentor_freshman: {
    title: 'The new guy',
    body: '{teammate} is a freshman who keeps getting lost on the weak side and in the building. He has asked you, specifically, for help with both.',
    choices: {
      take_him_on: {
        label: 'Take him under your wing',
        outcome:
          'Extra film, extra reps and one tour of the building. He has stopped walking into the women’s team’s locker room.',
        timeline: 'Mentored a freshman.',
      },
      one_tip: {
        label: 'Give him one good tip',
        outcome: '"Talk on defence, even when you are wrong." He wrote it on his hand.',
        timeline: 'Gave a freshman some advice.',
      },
      not_your_job: {
        label: 'Tell him to ask the coaches',
        outcome: 'He nodded and asked the coaches. They asked him why he had not asked you.',
        timeline: 'Turned away a freshman asking for help.',
      },
    },
  },
  bus_card_game: {
    title: 'Six hours on the bus',
    body: '{teammate} has a deck of cards with one queen missing and a theory about how that changes the odds.',
    choices: {
      play_for_money: {
        label: 'Play for real money',
        outcome:
          'Five-dollar hands from the state line to the hotel. Somebody finished richer, and the whole back of the bus knows who.',
        timeline: 'Played cards for money on the team bus.',
      },
      play_for_pride: {
        label: 'Play for pride',
        outcome:
          'Loser carries the ball bag tomorrow. You argued about the missing queen for an hour.',
        timeline: 'Played cards on the team bus.',
      },
      sleep: {
        label: 'Sleep',
        outcome:
          'You slept against the window and woke with the pattern of the curtain on your face.',
        timeline: 'Slept through the bus card game.',
      },
    },
  },
  exam_on_road_trip: {
    title: 'Midterm',
    body: 'Your midterm is on Thursday. On Thursday you will be in a hotel two time zones away, eating pasta at four in the afternoon.',
    choices: {
      study_on_the_bus: {
        label: 'Study on the bus',
        outcome:
          'Flashcards by reading light. The assistant coach quizzed you and got more of them right than you did.',
        timeline: 'Studied on a road trip.',
      },
      ask_to_reschedule: {
        label: 'Ask to sit it later',
        outcome:
          'The professor agreed to a make-up exam. He did not promise it would be the same exam.',
        timeline: 'Rescheduled a midterm.',
      },
      skip_it: {
        label: 'Take the zero',
        outcome: 'One zero, averaged over a semester. That is how you explained it to yourself.',
        timeline: 'Skipped a midterm.',
      },
      call_the_tutor: {
        label: 'Video-call the tutor from the hotel',
        outcome:
          'Two hours in the hotel business centre with your tutor and a whiteboard app. The night manager learned some statistics too.',
        timeline: 'Studied with the tutor on the road.',
      },
    },
  },
  professor_superfan: {
    title: 'The superfan',
    body: 'Your statistics professor wears your jersey to lecture. Today he asked the class to calculate your free-throw percentage. It was not flattering.',
    choices: {
      leave_tickets: {
        label: 'Leave him two tickets',
        outcome:
          'He came to the game in face paint. Your grade went up a little, and somebody in the class noticed.',
        timeline: 'Gave the professor tickets.',
      },
      keep_it_professional: {
        label: 'Keep it professional',
        outcome:
          'You thanked him and handed your homework in on time. He gave it full marks and a long note about shot selection.',
        timeline: 'Kept things professional with a superfan professor.',
      },
      talk_shop: {
        label: 'Talk numbers with him',
        outcome:
          'Office hours turned into a seminar on shot charts. You left with a better grade and a new opinion about corner threes.',
        timeline: 'Talked analytics with the professor.',
      },
    },
  },
  summer_school: {
    title: 'Summer classes',
    body: 'Your grade average is low enough that the adviser has highlighted it in yellow. Summer classes start Monday. So does open gym.',
    choices: {
      enroll: {
        label: 'Enrol in person',
        outcome:
          'Three classes in a lecture hall with no air conditioning. The grades are going the right way.',
        timeline: 'Took summer classes.',
      },
      online_course: {
        label: 'One online course',
        outcome:
          'You watched the lectures at double speed. The professor sounds like a race commentator now.',
        timeline: 'Took one online summer course.',
      },
      skip_summer_school: {
        label: 'Skip it',
        outcome: 'Open gym every day. The academic adviser has started opening emails with "So."',
        timeline: 'Skipped summer school.',
      },
    },
  },
  student_podcast: {
    title: 'The dorm podcast',
    body: 'Two students run a podcast from a storage cupboard in your dorm. It has nine hundred listeners and one sponsor, a sandwich shop that pays in sandwiches.',
    choices: {
      go_on: {
        label: 'Go on the show',
        outcome:
          'Fifty minutes on everything from the offence to which teammate cannot swim. Mostly harmless. Mostly.',
        timeline: 'Went on a student podcast.',
      },
      send_a_teammate: {
        label: 'Send a teammate instead',
        outcome:
          'Your backup centre went on and was hilarious. He is now more famous on campus than you.',
        timeline: 'Sent a teammate to the student podcast.',
      },
      decline: {
        label: 'Decline',
        outcome: 'You said you were busy. They recorded an episode about how busy you were.',
        timeline: 'Declined the student podcast.',
      },
    },
  },
  postgame_question: {
    title: 'The question',
    body: 'Post-game. {journalist} asks whether {teammate}’s turnover on the last possession decided it. {teammate} is sitting next to you with an ice pack on his knee.',
    choices: {
      defend_teammate: {
        label: 'Defend him',
        outcome:
          '"We lost that game in the first half. Next question." {teammate} bumped your fist under the table.',
        timeline: 'Defended a teammate at the press conference.',
      },
      honest_answer: {
        label: 'Answer honestly',
        outcome:
          'You said it hurt. You said it was not the only thing. The headline used the first half of that.',
        timeline: 'Answered honestly about a teammate’s mistake.',
      },
      deflect: {
        label: 'Talk about the next game',
        outcome:
          'You praised the next opponent in great detail. {journalist} wrote "deflected" in his notebook, legibly.',
        timeline: 'Deflected a press question.',
      },
      joke_it_off: {
        label: 'Turn it into a joke',
        outcome:
          'You asked whether he had counted your turnovers too. The room laughed, {teammate} laughed, and the clip was about you instead.',
        timeline: 'Joked through a hard press question.',
      },
    },
  },
  misquote_fallout: {
    title: 'In print',
    body: 'The long piece is out. One of your quotes about the offence is accurate and has been printed on its own. {coach} has it highlighted.',
    choices: {
      call_the_journalist: {
        label: 'Call {journalist} and complain',
        outcome:
          'He said every word was yours. He is right, and you both know it. The coach liked that you made the call.',
        timeline: 'Complained to the journalist about a quote.',
      },
      apologise_to_coach: {
        label: 'Apologise to the coach',
        outcome:
          'You explained the context. He listened, then said, "Context does not fit in a headline."',
        timeline: 'Apologised to the coach for a quote.',
      },
      shrug: {
        label: 'Shrug it off',
        outcome:
          'You said it was taken out of context. He said it was the only way it could have been taken.',
        timeline: 'Shrugged off an awkward quote.',
      },
      ask_for_correction: {
        label: 'Ask {journalist} to publish the full answer',
        outcome:
          'He posted the whole answer with an editor’s note. The coach read it and put the highlighter away.',
        timeline: 'Got the journalist to publish the full quote.',
      },
    },
  },
  documentary_crew: {
    title: 'Cameras',
    body: 'A streaming crew is making a series about your conference. They want a camera in your dorm, a microphone on your warm-up jacket and a shot of you staring out of a window.',
    choices: {
      full_access: {
        label: 'Give them everything',
        outcome:
          'You stared out of the window nine times before they were happy. Everyone back home will see your room.',
        timeline: 'Gave a documentary crew full access.',
      },
      games_only: {
        label: 'Games and practice only',
        outcome: 'They got the dunks and none of the laundry. A fair trade.',
        timeline: 'Let a documentary crew film games only.',
      },
      no_cameras: {
        label: 'No cameras',
        outcome: 'The crew followed your point guard instead. The coach was quietly relieved.',
        timeline: 'Turned down a documentary crew.',
      },
    },
  },
  journalist_heads_up: {
    title: 'Off the record',
    body: '{journalist} calls off the record. Another outlet is running a story about your shot selection, with charts. He thought you should hear about it before you saw the charts.',
    choices: {
      get_ahead_of_it: {
        label: 'Get ahead of it',
        outcome:
          'You talked about your shot selection first, and better. The charts landed on a story that was already old.',
        timeline: 'Got ahead of a critical story.',
      },
      thank_him: {
        label: 'Thank him',
        outcome: 'You owe him one now. He did not say so, which is how you know he knows.',
        timeline: 'Thanked the journalist for a warning.',
      },
      ignore_it: {
        label: 'Let it run',
        outcome: 'You decided you do not read that kind of thing. You will read it.',
        timeline: 'Ignored a warning about a critical story.',
      },
    },
  },
  fan_letter: {
    title: 'A letter in green crayon',
    body: 'A nine-year-old has written to you. The letter lists your three best moves and one thing you should work on, underlined in red.',
    choices: {
      visit_the_school: {
        label: 'Visit her school',
        outcome:
          'An assembly, two hundred questions, one about whether you have a dog. You do not. Several children were disappointed.',
        timeline: 'Visited a young fan’s school.',
      },
      write_back: {
        label: 'Write back',
        outcome:
          'You wrote a full page and agreed with her about the thing to work on. Her mother says it is framed above her bed.',
        timeline: 'Wrote back to a young fan.',
      },
      post_the_letter: {
        label: 'Post the letter online',
        outcome: 'Half a million people agreed with her about your left hand.',
        timeline: 'Posted a young fan’s letter.',
      },
    },
  },
  old_posts_resurface: {
    title: 'The archive',
    body: 'Someone has found your posts from when you were fourteen. Most are about cereal. One is a long and very confident prediction about a team you now play against.',
    choices: {
      apologise: {
        label: 'Apologise',
        outcome:
          'You apologised for being fourteen. People seemed to accept that you are not any more.',
        timeline: 'Apologised for old posts.',
      },
      make_a_joke: {
        label: 'Lean into it',
        outcome:
          'You reposted the worst one with "I stand by the cereal takes." The internet decided how funny that was.',
        timeline: 'Joked about old posts.',
      },
      delete_the_account: {
        label: 'Delete the account',
        outcome: 'Gone. Screenshots, unfortunately, are forever.',
        timeline: 'Deleted an old account.',
      },
    },
  },
  phone_detox: {
    title: 'Notifications',
    body: 'Your phone knows you are slumping. It has helpfully collected every opinion about it.',
    choices: {
      delete_the_apps: {
        label: 'Delete the apps',
        outcome:
          'Quiet. You read a novel on the bus and finished it. Nobody tagged you in the novel.',
        timeline: 'Deleted social apps during a slump.',
      },
      read_everything: {
        label: 'Read all of it',
        outcome:
          'Most of it was noise. A man with a cartoon frog for a profile picture made a fair point about your footwork.',
        timeline: 'Read every comment during a slump.',
      },
      post_through_it: {
        label: 'Post as if nothing is wrong',
        outcome: 'A workout video, a smiling selfie, a motivational quote. People could tell.',
        timeline: 'Posted through a slump.',
      },
    },
  },
  parents_visit: {
    title: 'Visitors',
    body: 'Your parents are flying in for the weekend game. Your father has printed the itinerary. Your mother has packed food for your roommate.',
    choices: {
      full_tour: {
        label: 'Show them everything',
        outcome:
          'Campus, gym, dining hall, your actual bed. Your father photographed the weight room as if it were a cathedral.',
        timeline: 'Showed the parents around campus.',
      },
      tickets_and_dinner: {
        label: 'Tickets and a nice dinner',
        outcome: 'Good seats, a restaurant with tablecloths, a bill you insisted on paying.',
        timeline: 'Hosted the parents for a game and dinner.',
      },
      ask_them_to_wait: {
        label: 'Ask them to come later in the season',
        outcome: 'They said of course. Your father unprinted the itinerary.',
        timeline: 'Asked the parents to postpone a visit.',
      },
      meet_the_coach: {
        label: 'Introduce them to the coach',
        outcome:
          'The coach told them you are coachable. Your father has repeated the word to everyone he knows.',
        timeline: 'Introduced the parents to the coach.',
      },
    },
  },
  sibling_money: {
    title: 'Your sister',
    body: 'Your younger sister has made the regional team. The trip costs six hundred dollars. She has not asked. Your mother has asked for her.',
    choices: {
      send_it_all: {
        label: 'Send all of it',
        outcome:
          'She sent a photo from the airport in a team tracksuit two sizes too big, grinning.',
        timeline: 'Paid for his sister’s team trip.',
      },
      send_half: {
        label: 'Send half',
        outcome:
          'Your parents covered the rest. Your sister sent a voice note that was mostly screaming.',
        timeline: 'Paid half of his sister’s trip.',
      },
      not_now: {
        label: 'Say you cannot right now',
        outcome:
          'Your mother said she understood. Your sister went anyway, on raffle money, and did not mention you.',
        timeline: 'Could not pay for his sister’s trip.',
      },
      cover_everything: {
        label: 'Cover the trip and a better hotel',
        outcome: 'Endorsement money put to proper use. She has told her whole team who paid.',
        timeline: 'Used endorsement money for his sister’s trip.',
      },
    },
  },
  grandmother_ill: {
    title: 'Hospital',
    body: 'Your grandmother is in hospital. Everyone says it is not serious, in the voice people use when they are not sure.',
    choices: {
      fly_home: {
        label: 'Fly home now',
        outcome:
          'You sat by the bed for two days. She spent most of them asking whether the coach feeds you.',
        timeline: 'Flew home to see his grandmother in hospital.',
      },
      call_every_night: {
        label: 'Call every night',
        outcome:
          'Ten minutes before lights out. By Friday she was well enough to criticise your free throws.',
        timeline: 'Called his grandmother in hospital every night.',
      },
      play_for_her: {
        label: 'Write her initials on your shoes',
        outcome:
          'Her initials in marker on both heels. A nurse held the phone up so she could watch.',
        timeline: 'Played for his grandmother.',
      },
    },
  },
  dad_voice_notes: {
    title: 'Voice notes',
    body: 'Your father sends a voice note after every game. Tonight’s is eleven minutes long and begins, "Okay. First half."',
    choices: {
      listen_to_all: {
        label: 'Listen to the whole thing',
        outcome: 'All of it. He was wrong about the zone and right about your hips on closeouts.',
        timeline: 'Listened to his father’s game review.',
      },
      mute_him: {
        label: 'Mute him for the season',
        outcome:
          'Silence after games. It is restful. Your mother has started passing his notes along in summary.',
        timeline: 'Muted his father’s game reviews.',
      },
      call_him_back: {
        label: 'Call him instead',
        outcome:
          'You asked about his week. He talked about the garden for twenty minutes and sounded happier than after any win.',
        timeline: 'Called his father back.',
      },
    },
  },
  nil_collective: {
    title: 'The collective',
    body: 'A booster collective is offering money for "appearances": car dealerships, a charity golf day, the opening of a mattress store. You would be asked to lie on a mattress.',
    choices: {
      sign_for_appearances: {
        label: 'Sign for the full schedule',
        outcome:
          'Twelve appearances, one mattress, a great many handshakes. The coach asked why you were yawning in walkthrough.',
        timeline: 'Signed a full collective deal.',
      },
      sign_small: {
        label: 'Sign for a few',
        outcome: 'Three events, a modest cheque, no mattresses.',
        timeline: 'Signed a small collective deal.',
      },
      decline: {
        label: 'Decline',
        outcome:
          'You said you would rather focus on the season. The collective said they would be in touch, and they will be.',
        timeline: 'Turned down a collective deal.',
      },
      bundle_with_tyre_shop: {
        label: 'Bring the tyre shop in too',
        outcome:
          'The tyre shop and the mattress store made a joint commercial. It has two slogans now, and both rhyme with your surname.',
        timeline: 'Bundled two local deals together.',
      },
    },
  },
  teammate_loan: {
    title: 'Rent',
    body: '{teammate} is four hundred dollars short on rent and has asked you in the quietest voice he owns.',
    choices: {
      lend_it: {
        label: 'Lend it',
        outcome:
          'He promised to pay you back by the end of the month and wrote it on a napkin, which you now have.',
        timeline: 'Lent a teammate rent money.',
      },
      give_it: {
        label: 'Give it, no strings',
        outcome:
          'You told him to forget it. He will not. Neither will the rest of the locker room.',
        timeline: 'Gave a teammate rent money.',
      },
      say_no: {
        label: 'Say you cannot',
        outcome:
          'He said it was fine and borrowed it from somebody else. Things are slightly different now.',
        timeline: 'Refused to lend a teammate money.',
      },
    },
  },
  coin_promotion: {
    title: 'An opportunity',
    body: 'A man with very white teeth wants you to post about a new digital coin. It has a cartoon dog for a logo and a white paper that is mostly the dog.',
    choices: {
      promote_it: {
        label: 'Post about the dog coin',
        outcome:
          'One post, one large payment. The caption he wrote for you says the dog is going to the moon.',
        timeline: 'Promoted a digital coin.',
      },
      decline: {
        label: 'Decline',
        outcome: 'You said no. He said you would regret it. He said it with his teeth.',
        timeline: 'Turned down a coin promotion.',
      },
      ask_agent: {
        label: 'Forward it to your agent',
        outcome: 'Your agent replied with one word, which was "no", followed by a full stop.',
        timeline: 'Let the agent kill a coin promotion.',
      },
    },
  },
  sleep_scores: {
    title: 'Sleep score',
    body: 'The athletic department gave everyone a sleep-tracking ring. Yours reports five hours and six minutes a night and has started to sound worried.',
    choices: {
      phone_out_of_room: {
        label: 'Phone out of the room at night',
        outcome:
          'Seven and a half hours by the second week. You have missed several memes and you are fine.',
        timeline: 'Fixed his sleep.',
      },
      nap_between_classes: {
        label: 'Nap between classes',
        outcome: 'You nap in the library now, directly under a sign that says no sleeping.',
        timeline: 'Started napping between classes.',
      },
      ignore_the_ring: {
        label: 'Take the ring off',
        outcome: 'Problem solved, in the sense that nothing is measuring it any more.',
        timeline: 'Ignored the sleep tracker.',
      },
    },
  },
  headache_after_knock: {
    title: 'Behind the eye',
    body: 'Since you played through that knock, there has been a dull headache behind your left eye. It gets worse under the gym lights.',
    choices: {
      tell_the_trainer: {
        label: 'Tell the trainer',
        outcome:
          'A light in your eyes, questions about the date, a long form. They may sit you for a while, just in case.',
        timeline: 'Reported a headache to the trainer.',
      },
      sleep_it_off: {
        label: 'Sleep it off',
        outcome: 'You slept twelve hours and woke up better, or close enough to better.',
        timeline: 'Slept off a headache without telling anyone.',
      },
      skip_film_rest: {
        label: 'Skip film and lie in the dark',
        outcome:
          'One evening in a dark room. The headache faded. The coach noticed your empty chair.',
        timeline: 'Skipped film to rest a headache.',
      },
    },
  },
  rival_at_camp: {
    title: 'Same camp',
    body: '{rival} is at the same summer skills camp. The counsellors have put your names next to each other on every drill sheet, which cannot be an accident.',
    choices: {
      guard_him: {
        label: 'Ask to guard him all week',
        outcome:
          'Five days of one-on-one. You know his first step now, and he knows that you know.',
        timeline: 'Guarded the rival all week at camp.',
      },
      room_with_him: {
        label: 'Share a room with him',
        outcome:
          'He snores and supports a football club you cannot stand. By Thursday you were splitting pizza.',
        timeline: 'Roomed with the rival at camp.',
      },
      avoid_him: {
        label: 'Keep your distance',
        outcome: 'Different drill groups, different tables. The counsellors seemed disappointed.',
        timeline: 'Avoided the rival at camp.',
      },
      outwork_him: {
        label: 'Be in the gym before him every morning',
        outcome:
          'He arrived at six to find you already sweating. On the third day he came at half past five. So did you.',
        timeline: 'Outworked the rival at camp.',
      },
    },
  },
  rival_injured: {
    title: '{rival} is hurt',
    body: '{rival} went down awkwardly last night and left on crutches. Your phone has opinions about what you should say.',
    choices: {
      send_a_message: {
        label: 'Send him a private message',
        outcome:
          '"Get well. I want you healthy when we play." He sent a thumbs-up and, an hour later, a thank-you.',
        timeline: 'Messaged the injured rival.',
      },
      say_nothing: {
        label: 'Say nothing',
        outcome: 'Some people read your silence as respect. Some read it as something else.',
        timeline: 'Said nothing about the rival’s injury.',
      },
      post_publicly: {
        label: 'Post something kind',
        outcome:
          'A clean, generous post. It got more attention than the injury did, which he may not love.',
        timeline: 'Posted support for the injured rival.',
      },
      visit_him: {
        label: 'Drive over and see him',
        outcome:
          'You brought bad snacks and a worse film. He said it was the first time he had laughed since the injury.',
        timeline: 'Visited the injured rival.',
      },
    },
  },
  rival_rematch_hype: {
    title: 'The rematch',
    body: 'A sports channel is promoting the next meeting as you against {rival}. The graphic has both of you glaring. Neither of you has ever glared.',
    choices: {
      add_fuel: {
        label: 'Add fuel',
        outcome:
          'You reposted the graphic with a clock emoji. The coach asked you to stop doing the channel’s marketing for it.',
        timeline: 'Hyped the rival rematch.',
      },
      bury_it: {
        label: 'Call him and end it',
        outcome:
          'Ten minutes on the phone. It turns out you both hate the graphic. It is over, more or less.',
        timeline: 'Ended the feud with the rival.',
      },
      let_the_game_talk: {
        label: 'Let the game do the talking',
        outcome: '"It is one game." It is not, and everyone knows it, but it was the right answer.',
        timeline: 'Refused to hype the rivalry.',
      },
    },
  },
  national_camp: {
    title: 'National team camp',
    body: 'The national team is holding a two-week camp. The practice jerseys are three years old and one still has a previous player’s name on it in marker.',
    choices: {
      stay_for_all_of_it: {
        label: 'Stay for both weeks',
        outcome:
          'A different system, different coaches and the same three songs on the bus. You came back thinking faster.',
        timeline: 'Attended the full national team camp.',
      },
      one_week: {
        label: 'Go for one week',
        outcome: 'The coaches said one week was fine. One of them said it twice.',
        timeline: 'Attended part of the national team camp.',
      },
      stay_for_classes: {
        label: 'Stay for summer classes',
        outcome:
          'Your grades thank you. The federation sent a polite email with no exclamation marks.',
        timeline: 'Skipped national team camp for classes.',
      },
      keep_the_promise: {
        label: 'Go, because you promised',
        outcome:
          'You arrived first and left last. The captain introduced you as "the one who said he would come, and came".',
        timeline: 'Kept a promise to the national team.',
      },
    },
  },
  national_veteran_call: {
    title: 'The captain calls',
    body: 'Your national team’s captain calls. He is thirty-four, has played in five countries and spends the first ten minutes asking about your knees.',
    choices: {
      ask_for_advice: {
        label: 'Ask him everything',
        outcome:
          'An hour on how referees think in different countries, and which hotel breakfasts to avoid. You took notes.',
        timeline: 'Took advice from the national team captain.',
      },
      promise_to_come: {
        label: 'Promise to play this summer',
        outcome: '"Good. Bring your own towel." He hung up before you could ask why.',
        timeline: 'Promised to play for the national team.',
      },
      keep_it_short: {
        label: 'Keep it short',
        outcome:
          'You were on your way to class. He said he understood, in the voice of a man who has said it before.',
        timeline: 'Cut short a call with the national team captain.',
      },
    },
  },
  declined_backlash: {
    title: 'Back home',
    body: 'A radio host back home spent forty minutes on the call-up you declined. Your uncle phoned in to defend you and was cut off.',
    choices: {
      explain_publicly: {
        label: 'Explain yourself',
        outcome:
          'A calm statement about your body and your schedule. Some listeners called in to agree. The host did not.',
        timeline: 'Explained declining the national team.',
      },
      promise_next_time: {
        label: 'Promise you will come next summer',
        outcome: 'The promise went on the front page. Now it has to be kept.',
        timeline: 'Promised to play for the national team next time.',
      },
      ignore_it: {
        label: 'Ignore it',
        outcome: 'You did not listen. Your uncle did, every day, and told you about it.',
        timeline: 'Ignored criticism from home.',
      },
    },
  },
  combine_measurements: {
    title: 'Measurements',
    body: 'Combine week. A trainer has sent you a video about posture. Measurements are taken barefoot at seven in the morning, when you are at your tallest.',
    choices: {
      stretch_every_morning: {
        label: 'Stretch every morning',
        outcome:
          'Whether it added a quarter of an inch is between you and the tape measure. It felt like it did.',
        timeline: 'Stretched before the combine.',
      },
      focus_on_drills: {
        label: 'Forget height, work on the drills',
        outcome:
          'Spot-up drills until you could do them asleep. Somebody timed your release and nodded.',
        timeline: 'Prepared for the combine drills.',
      },
      skip_the_combine: {
        label: 'Skip the combine',
        outcome: 'You stayed home and rested. Teams noticed the empty slot on the schedule.',
        timeline: 'Skipped the combine.',
      },
    },
  },
  odd_interview_question: {
    title: 'The interview',
    body: 'A general manager asks which kitchen appliance you would be, and why. Two assistants are writing down everything, including the pause.',
    choices: {
      answer_seriously: {
        label: 'Answer seriously',
        outcome:
          '"A dishwasher. Not glamorous. Always works." He wrote something and underlined it.',
        timeline: 'Gave a serious answer in a team interview.',
      },
      make_it_funny: {
        label: 'Make them laugh',
        outcome:
          'You said a toaster, "because I pop up when you need me". Some of the room laughed. You could not see who.',
        timeline: 'Joked in a team interview.',
      },
      ask_one_back: {
        label: 'Turn the question around',
        outcome:
          'He thought about it for a long time. Then he asked what his answer said about his team, and you had to have something.',
        timeline: 'Turned a team interview question around.',
      },
    },
  },
  head_to_head_workout: {
    title: 'Head to head',
    body: 'A team has invited you and {rival} to the same workout. One-on-one is on the schedule, written in pen.',
    choices: {
      compete: {
        label: 'Go at him',
        outcome:
          'Twenty minutes of one-on-one in front of a room full of clipboards. Your legs decided most of it.',
        timeline: 'Went one-on-one with the rival at a workout.',
      },
      shooting_only: {
        label: 'Ask to keep it to shooting',
        outcome:
          'They agreed and watched you make shots. The room was quieter than it might have been.',
        timeline: 'Kept a workout to shooting drills.',
      },
      settle_it: {
        label: 'Settle the feud on the floor',
        outcome: 'You asked to guard him first. Everyone in the gym leaned forward.',
        timeline: 'Settled the rivalry at a workout.',
      },
    },
  },
  medical_questions: {
    title: 'The medical file',
    body: 'Team doctors want the full file on the knock you played through. Your file is mostly tape.',
    choices: {
      share_everything: {
        label: 'Share everything',
        outcome:
          'Scans, notes and the trainer’s handwriting, all of it. The doctors read it the way mechanics look at a used car.',
        timeline: 'Shared full medical records with teams.',
      },
      limit_access: {
        label: 'Share only what they ask for',
        outcome: 'They got the minimum. Some teams were fine with that. Some started guessing.',
        timeline: 'Limited teams’ access to his medical records.',
      },
      agent_handles_it: {
        label: 'Let your agent decide who sees it',
        outcome:
          'Your agent sent it to the teams he trusts and not to the others. You have not been told which are which.',
        timeline: 'Let the agent manage the medical records.',
      },
      mention_the_painkillers: {
        label: 'Tell them about the painkillers',
        outcome:
          'You told them before they asked. One doctor wrote "honest" on his pad and circled it.',
        timeline: 'Told team doctors about the painkillers.',
      },
    },
  },
  draft_night_party: {
    title: 'Draft night plans',
    body: 'Your family wants to throw a draft-night party. Your aunt has already ordered a cake shaped like a jersey with no number on it yet.',
    choices: {
      big_party: {
        label: 'Rent a hall',
        outcome:
          'Eighty guests, a big screen, a cake. Every pick that is not you will be watched by eighty people.',
        timeline: 'Planned a big draft party.',
      },
      small_dinner: {
        label: 'Just dinner at home',
        outcome: 'Family, a long table, the television on mute until the first pick.',
        timeline: 'Planned a quiet draft night at home.',
      },
      watch_alone: {
        label: 'Watch it alone',
        outcome: 'Your family agreed, then booked a restaurant for the day after, just in case.',
        timeline: 'Planned to watch the draft alone.',
      },
      invite_the_team: {
        label: 'Invite your college teammates',
        outcome: 'Half the roster is driving in. Your aunt has ordered a second cake.',
        timeline: 'Invited college teammates to the draft party.',
      },
    },
  },
  agency_runner: {
    title: 'A friend of a friend',
    body: 'A man who is not an agent, but "works with" one, keeps turning up at your games. Tonight he wants to buy you dinner at the steakhouse with the cigar room.',
    choices: {
      go_to_dinner: {
        label: 'Go to dinner',
        outcome:
          'The steak was enormous. He paid in cash and said "no strings" in a way that suggested strings.',
        timeline: 'Had dinner with an agent’s runner.',
      },
      tell_compliance: {
        label: 'Tell compliance',
        outcome:
          'The compliance office took his description and asked you to call if he came back. They meant it.',
        timeline: 'Reported an agent’s runner.',
      },
      ignore_him: {
        label: 'Ignore him',
        outcome: 'You walked past him to the bus. He waved anyway.',
        timeline: 'Ignored an agent’s runner.',
      },
    },
  },
  marketing_plan: {
    title: 'The brand',
    body: '{agent} has a slide deck about your "brand pillars". There are four. One of them is authenticity, in a font he paid for.',
    choices: {
      brand_first: {
        label: 'Lean into the brand',
        outcome:
          'Photo shoots, a podcast tour, a signed deal for socks. Your workout schedule has gaps in it now.',
        timeline: 'Put marketing first before the draft.',
      },
      basketball_first: {
        label: 'Basketball first, brand later',
        outcome: 'You told him the brand is the jump shot. He added "jump shot" as a fifth pillar.',
        timeline: 'Put workouts ahead of marketing.',
      },
      trust_the_agent: {
        label: 'Let him run it',
        outcome: 'He was delighted. He sent a calendar invite for Tuesday titled "Authenticity".',
        timeline: 'Let the agent run the marketing.',
      },
    },
  },
  promise_call: {
    title: 'A promise',
    body: '{agent} says one team has "promised" to take you at their pick if you cancel your other workouts. He does the quotation marks with his voice.',
    choices: {
      trust_the_promise: {
        label: 'Cancel the other workouts',
        outcome:
          'You stopped travelling and started resting. The team in question has gone very quiet, which may be normal.',
        timeline: 'Cancelled workouts on a draft promise.',
      },
      keep_working_out: {
        label: 'Keep every workout',
        outcome:
          'Five cities in eight days. If the promise is real, nothing is lost. If it is not, you are covered.',
        timeline: 'Kept working out despite a promise.',
      },
      ask_for_proof: {
        label: 'Ask what the promise is worth',
        outcome:
          '{agent} said promises are never written down. That is the point of them, he said, and also the problem.',
        timeline: 'Questioned a draft promise.',
      },
    },
  },
  parking_tickets: {
    title: 'Under the wiper',
    body: 'There are six parking tickets under your wiper. Two are for the same space, which you maintain was unmarked.',
    choices: {
      pay_them: {
        label: 'Pay them',
        outcome: 'Two hundred and forty dollars for a space you still say was unmarked.',
        timeline: 'Paid the parking tickets.',
      },
      appeal: {
        label: 'Appeal in writing',
        outcome:
          'A two-page appeal with photographs. Campus parking either has a sense of humour or it does not.',
        timeline: 'Appealed the parking tickets.',
      },
      ignore_them: {
        label: 'Ignore them',
        outcome: 'You put them in the glovebox, which is a kind of filing.',
        timeline: 'Ignored the parking tickets.',
      },
    },
  },
  host_recruit: {
    title: 'The recruit',
    body: '{coach} asks you to host a recruit on his official visit. The recruit is six foot eight, very polite, and has already asked where the waterfall is.',
    choices: {
      honest_tour: {
        label: 'Show him the real campus',
        outcome:
          'The dining hall at its worst, the gym at its best. He asked good questions and got honest answers.',
        timeline: 'Gave a recruit an honest tour.',
      },
      sell_it_hard: {
        label: 'Sell it hard',
        outcome:
          'You told him he would start, room with you and never be cold. Two of those are true.',
        timeline: 'Sold the programme hard to a recruit.',
      },
      take_him_out: {
        label: 'Take him out on the town',
        outcome: 'You showed him a party. He was polite there too. Somebody took photos.',
        timeline: 'Took a recruit to a party.',
      },
      dawn_workout: {
        label: 'Bring him to your six a.m. workout',
        outcome:
          'He came. He was sick, politely, into a bin, and then asked if he could come back tomorrow.',
        timeline: 'Brought a recruit to a dawn workout.',
      },
    },
  },
} satisfies Catalog;
