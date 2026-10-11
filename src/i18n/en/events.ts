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
} satisfies Catalog;
