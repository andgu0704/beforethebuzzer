import type { Catalog } from '../format';

export const moments = {
  last_shot_tied: {
    title: 'Last shot',
    body: 'The ball is yours with the clock running down and the game there to be won.',
    options: {
      pull_up: {
        label: 'Pull up from the elbow',
        read: 'Your shot, your spot. They know it too.',
        success: 'Elbow, rise, release. Nothing but the bottom of the net.',
        failure: 'Good look, wrong side of the rim.',
      },
      drive: {
        label: 'Drive and draw contact',
        read: 'The lane is crowded, but the refs swallow whistles less at the rim.',
        success: 'You got to the rim and finished through the contact.',
        failure: 'You got there. So did their centre.',
      },
      kick_out: {
        label: 'Draw two and kick it out',
        read: 'If they collapse, someone is open in the corner.',
        success: 'Two defenders came. The corner three did not miss.',
        failure: 'Right pass, open shot, back iron.',
      },
      step_back: {
        label: 'Step back for three',
        read: 'Hard to guard. Harder to make.',
        success: 'Step, gather, splash. The bench emptied before it landed.',
        failure: 'You had the space. The ball did not have the legs.',
      },
    },
  },
  down_three_final: {
    title: 'Down three',
    body: 'Three behind with seconds left. A two is not enough.',
    options: {
      contested_three: {
        label: 'Rise over him',
        read: 'Contested, but it is a three.',
        success: 'Over the outstretched hand. Tie game.',
        failure: 'Hand in the face, ball on the rim, game over.',
      },
      pump_fake: {
        label: 'Pump fake for the foul',
        read: 'If he bites, you get three free throws. If he does not, it is a harder shot.',
        success: 'He left his feet. You did not need the free throws.',
        failure: 'He stayed down. The shot you got was worse.',
      },
      find_shooter: {
        label: 'Find the shooter',
        read: 'Your best shooter is curling off a screen.',
        success: 'On time, on target, through the net.',
        failure: 'The pass was a hair late and so was the shot.',
      },
    },
  },
  protect_the_lead: {
    title: 'One stop',
    body: 'You are up a possession. They are running something for their best player.',
    options: {
      stay_home: {
        label: 'Stay in front',
        read: 'No gambles. Make him shoot over you.',
        success: 'He shot over you and you were all the way up there with him.',
        failure: 'He made it anyway. Some shots you just tip your cap to.',
      },
      jump_the_pass: {
        label: 'Jump the passing lane',
        read: 'If you read it right, it is over. If not, nobody is home behind you.',
        success: 'You read the pass a beat before it was thrown. Ballgame.',
        failure: 'He looked you off. Open shot behind you.',
      },
      body_up: {
        label: 'Get physical',
        read: 'Bump the cutter, take him off his line. Risk the whistle.',
        success: 'He never got where he wanted to go.',
        failure: 'Whistle. And it went in.',
      },
    },
  },
  two_on_one: {
    title: 'Two on one',
    body: 'You stripped it at half court. One defender between you and the rim, a teammate on your wing.',
    options: {
      finish_it: {
        label: 'Take it yourself',
        read: 'Make him commit or finish over him.',
        success: 'He committed late. You finished early.',
        failure: 'He got a fingertip on it.',
      },
      dish_it: {
        label: 'Draw him and dish',
        read: 'One pass and it is a dunk.',
        success: 'Perfect timing. The dunk shook the backboard.',
        failure: 'Your teammate was looking the other way.',
      },
      transition_three: {
        label: 'Pull up for three',
        read: 'Nobody is closing out. Bold, though.',
        success: 'Pull-up three in transition. The crowd made a noise you could feel.',
        failure: 'Bold. Wrong.',
      },
    },
  },
  double_team: {
    title: 'Double team',
    body: 'They have decided you will not beat them alone. Two defenders, arms up, near the sideline.',
    options: {
      split_it: {
        label: 'Split the trap',
        read: 'If you get through, it is four on three. If not, it is a turnover.',
        success: 'Through the gap, into the lane, two points.',
        failure: 'They closed the gap.',
      },
      swing_it: {
        label: 'Swing it early',
        read: 'Beat the double with the pass.',
        success: 'One pass, two passes, open three. Exactly the plan.',
        failure: 'Swing, swing, miss.',
      },
      reset: {
        label: 'Back out and reset',
        read: 'Take the air out of it. Run the play again.',
        success: 'You reset, they lost track of the cutter, easy basket.',
        failure: 'Reset, shot-clock violation looming, bad shot.',
      },
    },
  },
  pick_and_roll_read: {
    title: 'The screen',
    body: 'Your big sets the screen. Their big hesitates. You have half a second to decide.',
    options: {
      pull_up: {
        label: 'Pull up behind the screen',
        read: 'The space is there for a breath.',
        success: 'Pull-up, released before the big got there.',
        failure: 'Pulled up. Rimmed out.',
      },
      hit_the_roller: {
        label: 'Pocket pass to the roller',
        read: 'If the big comes up, the roller is free.',
        success: 'Pocket pass, roll, dunk.',
        failure: 'The help came from the weak side.',
      },
      reject_screen: {
        label: 'Reject the screen',
        read: 'They are expecting the screen. Go the other way.',
        success: 'You went the other way. So did nobody else.',
        failure: 'Their guard read it all the way.',
      },
    },
  },
  post_mismatch: {
    title: 'Mismatch inside',
    body: 'After a switch, a smaller defender is on your back on the block.',
    options: {
      drop_step: {
        label: 'Drop step',
        read: 'Use the size. Go through him.',
        success: 'One dribble, one step, two hands on the rim.',
        failure: 'He held his ground better than he had any right to.',
      },
      turnaround: {
        label: 'Turnaround jumper',
        read: 'Shoot over him. No contact, no drama.',
        success: 'Fade, release, splash.',
        failure: 'Turnaround came up short.',
      },
      kick_it_back: {
        label: 'Kick it to the perimeter',
        read: 'They are sending help. Someone will be open.',
        success: 'Help came, ball went, three went in.',
        failure: 'The kick-out was right. The shot was not.',
      },
    },
  },
  rim_protection: {
    title: 'At the rim',
    body: 'Their guard has turned the corner and is coming downhill at you.',
    options: {
      wall_up: {
        label: 'Arms straight up',
        read: 'Contest without fouling.',
        success: 'He had to adjust. The adjustment missed.',
        failure: 'He finished around you.',
      },
      go_for_the_block: {
        label: 'Go for the block',
        read: 'Time it right and the crowd will remember. Time it wrong and so will the ref.',
        success: 'Pinned to the glass.',
        failure: 'Pump fake. You were in the air. He was not.',
      },
      take_the_charge: {
        label: 'Take the charge',
        read: 'Get there early and fall over.',
        success: 'Feet set, outside the circle, offensive foul.',
        failure: 'Blocking foul. You were half a step late.',
      },
    },
  },
  took_a_knock: {
    title: 'Something is wrong',
    body: 'You landed on a foot. The ankle went one way and you went the other. The trainer is jogging over.',
    options: {
      play_through: {
        label: 'Tape it and keep playing',
        read: 'You can walk. That might be enough tonight.',
        success: 'Tape, two hops, back on the floor. You will feel it tomorrow.',
        failure: 'You tried.',
      },
      sit_down: {
        label: 'Sit down',
        read: 'Not tonight. Maybe not this week.',
        success: 'You sat. Your team played on without you.',
        failure: 'You sat.',
      },
    },
  },
  bench_spark: {
    title: 'Off the bench',
    body: 'You have been on the floor for ninety seconds. The ball swings to you and your defender is late.',
    options: {
      let_it_fly: {
        label: 'Let it fly',
        read: 'Open three. Nobody is closing.',
        success: 'First touch, first shot, three points.',
        failure: 'Open look, short.',
      },
      attack_closeout: {
        label: 'Attack the closeout',
        read: 'He is flying at you. Use it.',
        success: 'Pump, one dribble, layup.',
        failure: 'The help was waiting.',
      },
      extra_pass: {
        label: 'Make the extra pass',
        read: 'Someone is more open than you.',
        success: 'Extra pass, open shot, made.',
        failure: 'Extra pass, open shot, missed.',
      },
    },
  },
  showcase_spotlight: {
    title: 'Spotlight',
    body: 'Every college coach in the building is watching this possession.',
    options: {
      go_to_move: {
        label: 'Your go-to move',
        read: 'Show them what you do every day.',
        success: 'Smooth. A coach in row three wrote something down.',
        failure: 'Rushed it. Happens.',
      },
      off_the_glass: {
        label: 'Off the glass to yourself',
        read: 'High risk, enormous reward.',
        success: 'Off the glass, back to yourself, dunk. The building lost its mind.',
        failure: 'The ball hit the glass and kept going.',
      },
      right_play: {
        label: 'Make the right play',
        read: 'Coaches notice good decisions too.',
        success: 'Drive, draw, dish, dunk. The coaches noticed.',
        failure: 'Right play, missed layup by somebody else.',
      },
    },
  },
  stop_their_star: {
    title: 'Their best player',
    body: 'Late, close, and they are going to their star. The coach looks at you.',
    options: {
      deny_the_catch: {
        label: 'Deny the catch',
        read: 'If he never gets it, he never scores it.',
        success: 'He never got it.',
        failure: 'Backdoor. You were too high.',
      },
      play_physical: {
        label: 'Make it physical',
        read: 'Wear him down. Risk the whistle.',
        success: 'He settled for a bad shot.',
        failure: 'Whistle, free throws, made.',
      },
      stay_disciplined: {
        label: 'Stay disciplined',
        read: 'No fouls, no gambles, a hand in his face.',
        success: 'Hand up, shot missed.',
        failure: 'He made a tough one. Tip of the cap.',
      },
    },
  },
  down_one_final: {
    title: 'Down one',
    body: 'One point behind in the last minute, and the play is for you. Any basket puts you ahead.',
    options: {
      floater: {
        label: 'Floater over the big',
        read: 'Their centre will sit at the rim. Release it before he arrives.',
        success: 'Soft, high, over his fingertips. It dropped as the bench stood up.',
        failure: 'High enough to clear him, too long to go in.',
      },
      hunt_the_foul: {
        label: 'Drive into his chest',
        read: 'Make the referee decide. Two free throws would do.',
        success: 'Contact, whistle, two free throws. Both went in.',
        failure: 'You went into him. The whistle stayed in the referee’s mouth.',
      },
      step_back_for_win: {
        label: 'Step back for three',
        read: 'Two would win it. Three would win it with style, and less often.',
        success: 'Rhythm step, high release, the net barely moved.',
        failure: 'You found the space and lost the arc.',
      },
      lob_to_the_big: {
        label: 'Throw the lob',
        read: 'Their big is watching you. Your big is behind him.',
        success: 'You looked left and threw it right. He caught it above the rim.',
        failure: 'The lob was a touch long. He touched it. The rim did not.',
      },
    },
  },
  full_court_heave: {
    title: 'Three seconds',
    body: 'Three seconds left, the length of the floor to go, and you are behind. The ball is in your hands after the inbound.',
    options: {
      heave_it: {
        label: 'Throw it from where you are',
        read: 'It almost never goes in. Almost.',
        success:
          'You threw it from your own free-throw line. It went in. Nobody in the building knows what to do.',
        failure: 'On line, hopelessly short. You tried.',
      },
      two_dribbles_and_fire: {
        label: 'Two dribbles, then fire',
        read: 'Closer is better, if the clock lets you.',
        success:
          'Two hard dribbles, a leaning three from the logo. It hit the back iron and dropped.',
        failure: 'The horn went as you rose. It would not have counted anyway.',
      },
      baseball_pass: {
        label: 'Throw it long to the big',
        read: 'He is behind everyone. If the pass gets there, so does the game.',
        success: 'A pass like a quarterback. He caught it, turned and laid it in at the horn.',
        failure: 'Their guard read it and knocked it out of bounds.',
      },
    },
  },
  end_of_half: {
    title: 'Beat the buzzer',
    body: 'Five seconds on the clock and the ball in your hands. Whatever happens, the period ends with this.',
    options: {
      beat_the_buzzer: {
        label: 'Pull up from deep',
        read: 'A long one. Free points if it falls.',
        success:
          'You let it go from a step inside half court. Three free points, and the bench in hysterics.',
        failure: 'Long, flat and nowhere near.',
      },
      get_to_the_rim: {
        label: 'Get all the way to the rim',
        read: 'Five seconds is enough if nobody stops you.',
        success: 'End to end in four seconds. The layup left your hand with one to spare.',
        failure: 'Their guard stood in the lane and the clock ran out on you.',
      },
      quick_kick: {
        label: 'Draw two and kick it',
        read: 'A rushed shot by somebody more open.',
        success: 'Kick, catch, release, horn. Good.',
        failure: 'He caught it with no time to set his feet.',
      },
    },
  },
  tip_in_to_win: {
    title: 'The last miss',
    body: 'Late, close, and the shot goes up while you have inside position. If it misses, it is yours.',
    options: {
      tip_it: {
        label: 'Tip it in',
        read: 'Fingertips only. No time for anything else.',
        success: 'It bounced off the rim and you guided it back up. It rolled in.',
        failure: 'You got a finger to it. It rolled the wrong way.',
      },
      gather_and_go_up: {
        label: 'Catch it and go back up strong',
        read: 'Two hands, two feet, and hope the clock agrees.',
        success: 'You caught it, landed and went straight back up through the contact.',
        failure: 'You caught it cleanly. Three of them were waiting on the way back up.',
      },
      kick_it_out: {
        label: 'Kick it out',
        read: 'Their bigs will collapse on you. The shooter will be alone.',
        success:
          'You kicked it to the corner while they came to you. It was the only open shot all night, and it went in.',
        failure: 'Open shot, rushed release.',
      },
    },
  },
  star_takeover: {
    title: 'Your turn',
    body: 'A few points down with five minutes left. Your teammates keep looking at you.',
    options: {
      go_iso: {
        label: 'Clear out and go',
        read: 'Your defender is tired. So are you, but less.',
        success: 'One hesitation, one pull-up. He was still going backwards when it went in.',
        failure: 'Good look. Wrong night.',
      },
      get_to_the_line: {
        label: 'Get to the line',
        read: 'Stop the clock, slow the game, take the points that are free.',
        success: 'You went straight at him and he fouled you. Two free throws, two makes.',
        failure: 'You drove, he moved his feet, the referee waved play on.',
      },
      trust_the_team: {
        label: 'Make them come to you, then move it',
        read: 'If they send two, somebody else gets the shot.',
        success: 'They sent two. You found the third man. The lead was down to one.',
        failure: 'The pass was right. The shot went in and out.',
      },
    },
  },
  tournament_down_two: {
    title: 'Season on the line',
    body: 'Tournament game, two behind, inside the last minute. Lose and you are packing tonight.',
    options: {
      tie_it: {
        label: 'Drive and tie it',
        read: 'A two sends it to overtime. Safer, not safe.',
        success: 'Downhill, through the gap, laid in off the glass. Level.',
        failure: 'The help came early and the layup came off the front of the rim.',
      },
      win_it: {
        label: 'Go for the win',
        read: 'One shot, no overtime. Your team is either going home or going on.',
        success: 'Off the screen, into the shot, through the net. The other bench sat down.',
        failure: 'It felt good leaving your hand. That is all you will remember about it.',
      },
      roll_man: {
        label: 'Hit the roller',
        read: 'They are guarding your shot. Nobody is guarding him.',
        success: 'Pocket pass, two hands, dunk. They called timeout with nothing left in it.',
        failure: 'The weak-side defender was a step ahead of you.',
      },
    },
  },
  international_last_shot: {
    title: 'For the country',
    body: 'The last minute of a close game, and your whole country is awake past midnight to watch it.',
    options: {
      handoff_three: {
        label: 'Take the handoff three',
        read: 'The set the coach drew. Everyone knows where to be.',
        success: 'Handoff, catch, release. Somewhere back home a street went loud all at once.',
        failure: 'Clean look. Front rim. The other bench ran past you.',
      },
      pick_and_pull: {
        label: 'Pull up off the screen',
        read: 'Their big drops in this system. The mid-range is yours.',
        success: 'He dropped. You pulled. The floor shook under the visiting fans.',
        failure: 'He stepped up this once. Of course he did.',
      },
      drive_the_gap: {
        label: 'Drive the gap',
        read: 'International referees let more go. Go anyway.',
        success: 'Through two defenders and a lot of elbows. It counted.',
        failure: 'They let it go. All of it.',
      },
    },
  },
  floater_in_the_lane: {
    title: 'In the lane',
    body: 'You turned the corner. Their big is backing up into the paint, waiting.',
    options: {
      float_it: {
        label: 'Float it over him',
        read: 'He will not come out. Do not make him.',
        success: 'A soft floater from eight feet. He watched it go over him.',
        failure: 'It rattled around and fell out.',
      },
      go_all_the_way: {
        label: 'Go all the way at him',
        read: 'Bigger risk, bigger reward. He has two fouls.',
        success: 'You went into his chest and finished around him.',
        failure: 'He got all ball. He wants you to know that.',
      },
      lob_it: {
        label: 'Throw the lob',
        read: 'If the big steps up, your big is alone.',
        success: 'He stepped up. The lob went over his head and into two hands.',
        failure: 'He did not step up. The lob went to nobody.',
      },
    },
  },
  shot_clock_bailout: {
    title: 'Three on the shot clock',
    body: 'The play broke down. The shot clock reads three and the ball is in your hands.',
    options: {
      step_back: {
        label: 'Step back',
        read: 'Make space and hope.',
        success: 'Step back, horn, net. Your coach applauded through his teeth.',
        failure: 'A tough shot that looked exactly like a tough shot.',
      },
      bully_to_the_rim: {
        label: 'Put your shoulder down',
        read: 'Two dribbles and contact. The foul might come.',
        success: 'Shoulder, contact, whistle. Points from nothing.',
        failure: 'He held his ground, and the shot clock beat you.',
      },
      tough_floater: {
        label: 'One dribble and a floater',
        read: 'Quick to get off, hard to make.',
        success: 'Off one foot, over two hands. It kissed the glass.',
        failure: 'Rushed. It hit the side of the backboard.',
      },
    },
  },
  zone_look: {
    title: 'They went zone',
    body: 'They have switched to a zone. Five defenders, nobody on anybody, everybody watching you.',
    options: {
      flash_high_post: {
        label: 'Flash to the high post',
        read: 'The soft middle of any zone. Catch it there and turn.',
        success: 'Catch at the free-throw line, face up, jumper. The zone collapsed a beat late.',
        failure: 'You caught it in the middle and got crowded out of a good shot.',
      },
      skip_pass: {
        label: 'Throw the skip pass',
        read: 'Over the top of the zone to the weak-side corner.',
        success: 'Over two sets of hands to the corner. In.',
        failure: 'The top of the zone got a fingertip on it.',
      },
      shoot_over_it: {
        label: 'Shoot over it',
        read: 'Zones give up threes. Take the one it gives you.',
        success: 'They gave it to you. You took it.',
        failure: 'They gave it to you on purpose, it turns out.',
      },
    },
  },
  heat_check: {
    title: 'Possession',
    body: 'Clean possession, the defence set, nothing forced yet. Your call.',
    options: {
      heat_check: {
        label: 'Heat check',
        read: 'You have hit your last few. One more from further out?',
        success:
          'Three steps behind the line and it never touched the rim. The other coach called timeout.',
        failure: 'The heat check checked out. Nothing lasts.',
      },
      run_the_set: {
        label: 'Run the set',
        read: 'Pick-and-roll, elbow pull-up. The bread and butter.',
        success: 'The screen was good and the shot was better.',
        failure: 'Right play, short.',
      },
      attack_the_mismatch: {
        label: 'Attack the mismatch',
        read: 'A slower defender switched onto you. Go by him.',
        success: 'He was still turning around when you scored.',
        failure: 'Slower but longer. He blocked it from behind.',
      },
      move_it_on: {
        label: 'Swing it and cut',
        read: 'The defence is waiting for you to shoot. Do not.',
        success: 'Swing, swing, open three for a teammate.',
        failure: 'Swing, swing, a three that hit every part of the rim except the inside.',
      },
    },
  },
  offensive_rebound: {
    title: 'Second chance',
    body: 'Your teammate’s shot is long off the rim. You have position and the ball is coming down into your hands.',
    options: {
      put_it_back: {
        label: 'Put it straight back',
        read: 'Before the defence turns round.',
        success: 'Catch and finish in one motion. Their centre was still looking at the rim.',
        failure: 'Too quick. It came back off the front of the rim.',
      },
      reset_the_offence: {
        label: 'Kick it out and reset',
        read: 'A new shot clock and a scrambled defence.',
        success: 'Out to the arc, one pass, open three. Second chances count the same.',
        failure: 'Reset, swing, missed three.',
      },
      go_up_strong: {
        label: 'Go up through all of them',
        read: 'Three bodies under there. Draw a foul or score through it.',
        success: 'You went up through three of them and the ball went in. And one.',
        failure: 'They came down on you together. No whistle.',
      },
    },
  },
  lob_threat: {
    title: 'Above the rim',
    body: 'You set the screen and their big has to decide: you or the ball.',
    options: {
      catch_the_lob: {
        label: 'Roll hard and go up',
        read: 'If the guard throws it high enough, nobody else can reach it.',
        success: 'Caught at the top of the square, thrown down with both hands.',
        failure: 'You got there. The ball arrived a little behind you.',
      },
      seal_and_post: {
        label: 'Seal the smaller defender',
        read: 'They switched. A guard is on your hip.',
        success: 'You sealed him on your back, caught it and turned for an easy two.',
        failure: 'He fronted you and the entry pass never came.',
      },
      pop_out: {
        label: 'Pop out for three',
        read: 'Their big is guarding the rim. The arc is empty.',
        success: 'Pop, catch, three. Their big is now guarding the arc.',
        failure: 'You popped open and missed open.',
      },
      short_roll_pass: {
        label: 'Catch on the short roll and pass',
        read: 'Two defenders on the ball means a shooter alone in the corner.',
        success: 'Catch at the free-throw line, one look, corner three. In.',
        failure: 'You saw it late. The corner defender recovered.',
      },
    },
  },
  post_double_down: {
    title: 'The dig',
    body: 'You catch on the block. Their guard drops down to dig at the ball as soon as you put it on the floor.',
    options: {
      spin_baseline: {
        label: 'Spin baseline',
        read: 'Away from the help, towards a lot of trouble.',
        success: 'Spin, gather, reverse layup on the other side of the rim.',
        failure: 'The spin was quick. The baseline defender was quicker.',
      },
      pass_out_of_it: {
        label: 'Pass out of it',
        read: 'He left a shooter to come and help. Find him.',
        success: 'The guard came down, you found his man. Three points.',
        failure: 'Right read. Late pass.',
      },
      up_and_under: {
        label: 'Up and under',
        read: 'Show the shot, let him jump, step through.',
        success: 'He jumped at the fake. You stepped through and kissed it off the glass.',
        failure: 'He did not jump. He has seen it before.',
      },
    },
  },
  steal_and_go: {
    title: 'Pickpocket',
    body: 'You poked it loose at half court and you are gone. One defender is scrambling back.',
    options: {
      lay_it_in: {
        label: 'Lay it in',
        read: 'Simple. Take the two.',
        success: 'Two points and a crowd on its feet.',
        failure: 'He caught you from behind. You will hear about it.',
      },
      wait_for_the_trailer: {
        label: 'Slow up and drop it to the trailer',
        read: 'Your shooter is filling the lane behind you.',
        success: 'You held it a beat, dropped it back, three.',
        failure: 'The trailer was open and short.',
      },
      windmill: {
        label: 'Windmill it',
        read: 'Nobody is near you. That is what the windmill is for.',
        success: 'Full windmill. The bench was on the court before you landed.',
        failure: 'The windmill hit the back of the rim. Your coach looked at the ceiling.',
      },
      pull_it_out: {
        label: 'Pull it out and run offence',
        read: 'Kill the clock. Make them guard a whole possession.',
        success: 'You took the air out and made them defend. The set ended in a clean look.',
        failure: 'You pulled it out. The possession went nowhere.',
      },
    },
  },
  outnumbered_back: {
    title: 'Last one back',
    body: 'Turnover. Two of them coming at you and you are the only one back.',
    options: {
      take_the_charge: {
        label: 'Plant your feet',
        read: 'Pick the ball-handler and stand there.',
        success: 'Feet set, chest up, down you went. Offensive foul.',
        failure: 'He passed it a moment before he hit you.',
      },
      stay_between: {
        label: 'Stay between them',
        read: 'Fake at one, take the other. Buy a second for help.',
        success: 'You stopped the ball, the pass came late, help arrived.',
        failure: 'They were simply two and you were simply one.',
      },
      jump_the_pass: {
        label: 'Gamble on the pass',
        read: 'He always passes. Get there first.',
        success: 'He passed. You were already there. The other way, the other way!',
        failure: 'He did not pass this time.',
      },
    },
  },
  chase_down: {
    title: 'Chase it down',
    body: 'Their guard is away on a breakaway. You are three strides behind and gaining.',
    options: {
      chase_it_down: {
        label: 'Go for the chase-down',
        read: 'Time the jump right and you will be on every highlight show.',
        success: 'He never saw you coming. Pinned against the glass.',
        failure: 'You arrived as the ball left his hand. Foul, and it counted.',
      },
      contest_without_jumping: {
        label: 'Run with him, hand up',
        read: 'Bother him. Do not foul him.',
        success: 'He felt you coming and hurried it. Off the rim.',
        failure: 'He did not hurry. Two points.',
      },
      pin_it: {
        label: 'Get up there with him',
        read: 'You can get higher than he thinks you can.',
        success: 'You caught it at the top of his release and took it away clean.',
        failure: 'You got up there. He waited until you came down.',
      },
    },
  },
  inbound_deny: {
    title: 'The inbound',
    body: 'Up a possession late on, their ball on the sideline. Their shooter needs to catch it first.',
    options: {
      deny_the_catch: {
        label: 'Deny their shooter',
        read: 'Stay attached. Make the inbounder find someone else.',
        success: 'He could not get open. The inbounder panicked and threw it away.',
        failure: 'He shook you on a back screen and caught it alone.',
      },
      switch_everything: {
        label: 'Switch everything',
        read: 'No gaps, no mismatches, nothing easy.',
        success: 'They ran their play and got nothing. A long, hurried miss.',
        failure: 'They ran their play and it worked.',
      },
      guard_the_inbounder: {
        label: 'Put your arms in the inbounder’s face',
        read: 'Make the pass harder. Leave your man to the switch.',
        success: 'He had nowhere to throw it. Five seconds. Your ball.',
        failure: 'He threw it over you to the man you left.',
      },
    },
  },
  up_three_foul: {
    title: 'Up three',
    body: 'Three ahead, under eight seconds, and they are bringing it up for a tying three.',
    options: {
      foul_now: {
        label: 'Foul before he shoots',
        read: 'Two free throws cannot tie it. Do not foul him in the act.',
        success: 'You fouled him at half court. Two free throws, and the game was out of reach.',
        failure: 'You reached in as he went up. Three free throws.',
      },
      run_him_off_the_line: {
        label: 'Run him off the line',
        read: 'No threes. Let him have two.',
        success: 'He had to put it on the floor. Two points, game over.',
        failure: 'He stepped round you and shot it anyway.',
      },
      top_lock_the_shooter: {
        label: 'Top-lock their shooter',
        read: 'Make sure the best shooter never touches it.',
        success: 'He never touched it. Their second option missed.',
        failure: 'Their second option did not miss.',
      },
    },
  },
  pick_and_roll_defence: {
    title: 'The screen is coming',
    body: 'Their guard calls for a screen and your man is setting it.',
    options: {
      hedge_hard: {
        label: 'Hedge hard',
        read: 'Jump out at the ball and trap. Recover if you can.',
        success: 'He picked up his dribble. You poked it away.',
        failure: 'He split you both and the rim was empty.',
      },
      drop_back: {
        label: 'Drop and protect the rim',
        read: 'Give him the mid-range. Take away everything else.',
        success: 'He took the mid-range and missed it.',
        failure: 'He took the mid-range. It turns out he likes the mid-range.',
      },
      switch_it: {
        label: 'Switch onto the guard',
        read: 'Stay in front of a quicker player for one possession.',
        success: 'You slid with him all the way to a bad shot.',
        failure: 'One crossover. You are still facing the wrong way.',
      },
    },
  },
  closeout: {
    title: 'The closeout',
    body: 'The ball swings to their shooter, who has made three in a row. You are a few strides away.',
    options: {
      fly_at_him: {
        label: 'Fly at him',
        read: 'Get a hand on the shot, even if he drives past you.',
        success: 'You got all of it. He looked at his hand as if it had betrayed him.',
        failure: 'He pump-faked. You landed in the second row.',
      },
      short_closeout: {
        label: 'Short, choppy closeout',
        read: 'Arrive under control. Take away the drive.',
        success: 'Hand up, feet under you. He hesitated and the shot clock did the rest.',
        failure: 'You were under control. He was just better.',
      },
      take_away_the_three: {
        label: 'Run him off the line',
        read: 'Make him put it on the floor. Your help is behind you.',
        success: 'He put it down, ran into help and coughed it up.',
        failure: 'He put it down and found the open man.',
      },
    },
  },
  loose_ball: {
    title: 'Loose ball',
    body: 'A tipped pass is rolling towards the sideline. Two of you are chasing it.',
    options: {
      dive_for_it: {
        label: 'Dive on the floor',
        read: 'It will hurt. Coaches remember who dives.',
        success: 'You hit the floor, tied it up and the arrow was yours. The bench stood for that.',
        failure: 'You dove. He picked it up over you.',
      },
      stay_on_your_feet: {
        label: 'Stay on your feet',
        read: 'Get there under control and keep playing.',
        success: 'You got there first, upright, and started the break.',
        failure: 'He dove. You did not.',
      },
    },
  },
  late_switch_mismatch: {
    title: 'Switched onto their centre',
    body: 'A late switch has left you on their centre, who is calling for the ball with a big smile.',
    options: {
      front_the_post: {
        label: 'Front him',
        read: 'If he never catches it, size does not matter.',
        success: 'You played in front and the entry pass bounced off your hands into the stands.',
        failure: 'They lobbed it over you. He did not even jump.',
      },
      push_him_off_the_block: {
        label: 'Push him off his spot',
        read: 'Lean, hold, risk the whistle. Make him catch it further out.',
        success: 'He caught it two steps further out and turned into a charge.',
        failure: 'You leaned. The referee leaned in too, with his whistle.',
      },
      call_for_help: {
        label: 'Call for help',
        read: 'Shout. Someone will come.',
        success: 'Help came on the catch. He kicked it out to a worse shooter, who missed.',
        failure: 'Help came a moment late.',
      },
    },
  },
  bench_pressure: {
    title: 'Fresh legs',
    body: 'You just came in. The coach wants pressure, and your legs are the freshest on the floor.',
    options: {
      pick_him_up_full_court: {
        label: 'Pick him up full court',
        read: 'Make him work for every dribble. Maybe he slips.',
        success: 'He tried to go between his legs at half court. Not tonight.',
        failure: 'He beat the pressure and the defence behind you was outnumbered.',
      },
      stay_solid: {
        label: 'Stay solid',
        read: 'Do your job. No gambles off the bench.',
        success: 'Nothing fancy. A stop.',
        failure: 'Solid. He scored over solid.',
      },
      draw_the_charge: {
        label: 'Look for the charge',
        read: 'He drives with his head down. Be where he is going.',
        success: 'You got there first and fell over correctly. His fourth foul.',
        failure: 'Blocking foul. The bench groaned on your behalf.',
      },
    },
  },
  rivalry_isolation: {
    title: 'The matchup',
    body: 'Your rival is guarding you. He asked to. He is talking already.',
    options: {
      isolate_him: {
        label: 'Clear the side and isolate',
        read: 'Him and you. Everyone knows what this is.',
        success: 'Jab, rise, score. You did not say anything back. You did not need to.',
        failure: 'He stayed in front of you and said so, at length.',
      },
      post_him_up: {
        label: 'Take him to the block',
        read: 'He is quicker. Make it about strength.',
        success: 'You backed him down and turned over his shoulder. He was arguing for a foul.',
        failure: 'He held his ground. Stronger than he looks.',
      },
      make_him_chase: {
        label: 'Make him chase you through screens',
        read: 'Tire him out before the last five minutes.',
        success: 'Three screens and he was a step late. A clean pull-up.',
        failure: 'He fought over every screen. He wanted it more, this once.',
      },
      let_it_go: {
        label: 'Do not take the bait',
        read: 'Swing it. Make him guard nobody.',
        success: 'You moved it on and a teammate scored. Your rival looked confused.',
        failure: 'You made the pass. The shot did not make anything.',
      },
    },
  },
  rivalry_defend: {
    title: 'Your turn to guard him',
    body: 'Your rival has the ball and has waved his teammates away. He wants you, specifically.',
    options: {
      crowd_him: {
        label: 'Crowd him',
        read: 'Hands active, body close. Make him uncomfortable.',
        success: 'You reached at exactly the right time. He looked at his empty hands.',
        failure: 'He used your reach against you and went past.',
      },
      make_him_shoot_over_you: {
        label: 'Make him shoot over you',
        read: 'No fouls. No gifts.',
        success: 'Contested, off balance, off the rim.',
        failure: 'He made a hard shot over you. He will mention it.',
      },
      beat_him_to_the_spot: {
        label: 'Beat him to his spot',
        read: 'You know where he likes to go. Be there first.',
        success: 'You were standing on his favourite spot when he arrived. Offensive foul.',
        failure: 'He changed his favourite spot.',
      },
    },
  },
  international_physical: {
    title: 'Different rules',
    body: 'International game. The referees allow more contact than you are used to, and the defenders know it.',
    options: {
      euro_step: {
        label: 'Euro step through it',
        read: 'Change direction between the hands.',
        success: 'Left, right, layup. The arms grabbed at where you had been.',
        failure: 'They took your legs and the whistle stayed quiet.',
      },
      roll_it_to_the_big: {
        label: 'Pick-and-roll with the big',
        read: 'Their bigs drop. Use your big.',
        success: 'A pocket pass and a dunk from a centre who plays in Spain.',
        failure: 'Their big recovered in time and took a charge.',
      },
      corner_three: {
        label: 'Run to the corner',
        read: 'The shortest three is the one they do not guard.',
        success: 'You found the corner and the corner found the net.',
        failure: 'Open corner three, and the rim had a different idea.',
      },
    },
  },
  international_shooter: {
    title: 'Their shooter',
    body: 'Late in an international game, their shooter has hit four already. The coach says you have him.',
    options: {
      trail_every_screen: {
        label: 'Trail every screen',
        read: 'Stay on his hip and never let him turn.',
        success: 'He ran all over the floor and you were attached the whole way. Nothing.',
        failure: 'One screen too many. He caught it with daylight.',
      },
      go_under: {
        label: 'Go under the screens',
        read: 'Save your legs. Meet him at the other side.',
        success: 'You met him where he was going. He passed it away.',
        failure: 'He did not go anywhere. He shot it from the screen.',
      },
      switch_and_talk: {
        label: 'Switch and talk',
        read: 'Hand him off and trust your big.',
        success: 'Loud switch, clean switch, contested miss.',
        failure: 'Your big heard you a second late.',
      },
    },
  },
  tournament_opening: {
    title: 'First touches',
    body: 'Tournament nerves. Everybody’s legs are a bit heavy and nobody has scored for a while.',
    options: {
      easy_one_first: {
        label: 'Get an easy one first',
        read: 'Seeing the ball go in fixes most things.',
        success: 'A simple cut and a simple layup. You could feel the nerves go.',
        failure: 'Even the easy one did not go in.',
      },
      first_shot_three: {
        label: 'Take the open three',
        read: 'If it is there, it is there.',
        success: 'First shot, three points. The team started breathing again.',
        failure: 'It was there. It was short.',
      },
      find_a_teammate: {
        label: 'Get a teammate going',
        read: 'Your big has not touched it yet.',
        success: 'Pocket pass, dunk. The big came back down shouting.',
        failure: 'He bobbled it out of bounds. Nerves.',
      },
    },
  },
  exhibition_experiment: {
    title: 'Try something',
    body: 'Exhibition game. The coach said beforehand that tonight is for trying things you would not try in March.',
    options: {
      new_step_back: {
        label: 'The new step-back',
        read: 'The one you have been practising all summer.',
        success: 'It worked exactly as it does at six in the morning.',
        failure: 'It worked exactly as it did the first week of summer.',
      },
      left_hand_floater: {
        label: 'Left-handed floater',
        read: 'Your weak hand, in front of people.',
        success: 'Off the left hand, soft as you like. You might keep that.',
        failure: 'Your left hand has not caught up with the idea yet.',
      },
      post_the_guard: {
        label: 'Post up their guard',
        read: 'You have never posted anybody. Why not.',
        success: 'You backed him down with no idea what you were doing. Neither did he.',
        failure: 'Your post-up is a work in progress.',
      },
    },
  },
  showcase_defence: {
    title: 'Show them defence',
    body: 'The showcase. Coaches in the stands care about more than scoring. Their best guard is bringing the ball up.',
    options: {
      pick_his_pocket: {
        label: 'Go for the steal',
        read: 'A steal and a dunk is a highlight. A miss is a layup the other way.',
        success:
          'You took it clean at half court and finished at the other end. Pens moved in the stands.',
        failure: 'He went behind his back and you were watching the crowd.',
      },
      meet_him_at_the_rim: {
        label: 'Meet him at the rim',
        read: 'Let him beat you, then recover and block it.',
        success:
          'He beat you, you recovered and blocked him from behind. That one goes on the tape.',
        failure: 'He beat you, and that one goes on the tape too.',
      },
      just_guard_him: {
        label: 'Just guard him',
        read: 'Coaches like boring defence. Move your feet.',
        success: 'Down in a stance for the whole possession. He gave up the ball.',
        failure: 'Good defence, better shot.',
      },
    },
  },
  garbage_time: {
    title: 'Comfortably ahead',
    body: 'The game is won. The walk-ons are on the floor and they are looking at you very hopefully.',
    options: {
      lob_for_the_walk_on: {
        label: 'Throw a lob to the walk-on',
        read: 'He has never dunked in a game. He has told everyone.',
        success:
          'He caught it and dunked it and the whole bench ran on to the floor. The referee chose not to see it.',
        failure: 'He jumped too early. He will be fine. He will never be fine.',
      },
      one_for_yourself: {
        label: 'Get one for yourself',
        read: 'Open three. Nobody is guarding anybody.',
        success: 'One more for the stat sheet.',
        failure: 'Even in garbage time.',
      },
      run_the_clock: {
        label: 'Run the clock out',
        read: 'Dribble, pass, respect the other team.',
        success: 'You dribbled it out. Their coach nodded at you at the handshake.',
        failure: 'The pass was stolen and they scored. Nobody minded much.',
      },
    },
  },
  down_big_pride: {
    title: 'Pride',
    body: 'Down by a lot with five minutes left. The result is decided. How you play the rest is not.',
    options: {
      attack_the_rim: {
        label: 'Keep attacking',
        read: 'Play the last five like the first five.',
        success: 'You went at them as if the score were level. The coach noticed.',
        failure: 'Tired legs and a lot of bodies in the lane.',
      },
      hunt_your_shot: {
        label: 'Get your numbers',
        read: 'Nobody will remember the score. The box score lasts.',
        success: 'Your shot went in. Your points went up. The score did not change much.',
        failure: 'The shot you hunted got away.',
      },
      run_the_offence: {
        label: 'Run the offence properly',
        read: 'Run the plays. Next week will use the same ones.',
        success: 'Four passes and a good shot. The film session will be shorter for it.',
        failure: 'The right shot, and it rimmed out.',
      },
    },
  },
  ankle_late: {
    title: 'Not now',
    body: 'Five minutes left in a game that matters, and you have just rolled your ankle. The trainer is waiting for a look from you.',
    options: {
      stay_in: {
        label: 'Wave the trainer off',
        read: 'Five minutes. You can do anything for five minutes.',
        success: 'You limped to the huddle and did not limp out of it. It will swell tonight.',
        failure: 'You tried to stay in.',
      },
      come_out: {
        label: 'Come out',
        read: 'Your team needs you next week too.',
        success: 'You came out. Somebody had to be sensible.',
        failure: 'You sat with ice on it and shouted at the referees from the bench instead.',
      },
      tape_it_tighter: {
        label: 'Tape it tighter and get back out',
        read: 'This is not your first bad ankle. You know what it can take.',
        success: 'Retaped in ninety seconds. Back before the next timeout.',
        failure: 'Retaped and back. The ankle did not sign up for it.',
      },
      numb_it: {
        label: 'Take something for it',
        read: 'You know where the painkillers are. You know what they cost later.',
        success: 'You cannot feel it. You finished the game. You will feel it.',
        failure: 'Numb is not the same as fine.',
      },
    },
  },
} satisfies Catalog;
