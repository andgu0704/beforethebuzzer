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
} satisfies Catalog;
