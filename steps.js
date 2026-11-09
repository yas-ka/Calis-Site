/* Beginner step-by-step instructions, one array per exercise, in ladder order (index = level). */
var STEPS = {
  hs: [
    ["Start on hands and knees, hands shoulder-width, fingers spread wide.", "Tuck the toes and lift the hips up and back into an upside-down V, legs as straight as is comfortable.", "Press the floor away, let the head hang between the arms, hold and breathe steadily."],
    ["Put your hands on the floor about a leg-length from a wall and place your feet on the wall at hip height.", "Walk the hands back toward the wall until your body forms an L shape with locked arms.", "Push tall through the shoulders, keep the ribs in, hold and breathe."],
    ["Start in a plank position with your feet near a wall and your belly facing it.", "Walk the feet up the wall while walking the hands back toward it, until your chest is close to the wall.", "Push the floor away, squeeze legs and glutes, look between your hands. To exit, walk down the same way."],
    ["Set up a pike position with your feet on a chair and hips high.", "Bend the elbows and lower the top of your head toward the floor, travelling slightly forward of the hands.", "Press back up to straight arms, keeping the hips high. Move slowly."],
    ["Walk into a chest-to-wall handstand with a thick folded mat under your head.", "Bend your elbows slowly, counting 5 seconds, until the head lightly touches the mat.", "Walk the feet down off the wall (or press back up if you can). Rest fully between reps."],
    ["Get into a chest-to-wall handstand with a 5-8 cm stack (a folded towel) under your head.", "Lower until the head touches the stack, elbows at about 45 degrees.", "Press back up to locked arms, keeping the body tight and straight."],
    ["Wall handstand, hands shoulder-width, a thin mat under your head.", "Lower with control until your head touches the floor.", "Press all the way up to locked elbows without bouncing off the wall."],
    ["Place two stable stacks of books or parallettes shoulder-width apart and hold a wall handstand on them.", "Lower your head deeper than your hands, between them.", "Press back to lockout. Add depth only a little at a time."],
    ["Stand about a hand-length from the wall (or use the wall to learn), hands shoulder-width on the floor.", "Kick up one leg after the other with a straight body, stacking hips over shoulders over hands.", "Balance by pressing the fingertips if you fall forward, the heel of the hands if you fall back. Exit by lowering a leg or cartwheeling out."],
    ["Hold a steady freestanding handstand.", "Lower your head toward a mat in a controlled arc, elbows at about 45 degrees.", "Press back to the top without losing the straight line."]
  ],
  push: [
    ["Stand an arm's length from a wall, hands on it at shoulder height, shoulder-width apart.", "Keep your body in one straight line and bend the elbows until your chest nears the wall.", "Push back to straight arms. Breathe in on the way down, out on the push."],
    ["Place your hands on a stable counter edge, shoulder-width, with your feet back so the body is a straight slope.", "Lower your chest to the counter edge, elbows about 45 degrees from the body.", "Push back up without letting the hips sag."],
    ["Put your hands on a stable chair seat or sofa edge (brace it against a wall), body a straight slope.", "Lower the chest to the edge with control, elbows about 45 degrees.", "Press back up, keeping glutes and abs tight."],
    ["Place your hands under your shoulders on the floor, feet hip-width, body straight from head to heels.", "Lower until your chest is a fist above the floor, elbows about 45 degrees.", "Press the floor away until the arms are straight. If form breaks, go back to a chair incline."],
    ["Make a diamond with your thumbs and index fingers under the chest, body straight.", "Lower with the elbows brushing your ribs.", "Press up. Go back to regular push-ups if wrists or elbows complain."],
    ["Put your feet on a chair and hands on the floor slightly wider than the shoulders.", "Lower the chest toward the floor with the body rigid.", "Press up, keeping the shoulders away from the ears."],
    ["Start wide in a push-up position, hands far apart.", "Bend one elbow and lower toward that hand while the other arm stays straight.", "Press back up and alternate sides."],
    ["Put your hands by the hips with the fingers turned slightly out, and lean forward until the shoulders pass the hands.", "Keeping the lean, bend the elbows back along the ribs.", "Press up. Go slowly and strictly."],
    ["Put one hand on a counter, feet wide, other arm behind your back.", "Lower the chest toward the hand keeping the hips square.", "Press back up. Use a wider stance if you twist."],
    ["Stand with feet wide, one hand under the chest, the other behind the back.", "Lower the chest straight down without twisting.", "Press up to a straight arm. Only move here once the incline version is easy."]
  ],
  dips: [
    ["Sit on a sturdy bench edge, hands beside the hips, and slide off with your knees bent.", "Bend the elbows straight back until they reach about 90 degrees.", "Press back up until the arms are straight."],
    ["Same set-up as before, but straighten your legs with heels on the floor.", "Lower until the elbows are about 90 degrees, keeping them pointing back.", "Press up to straight arms."],
    ["Put your hands on one chair and your feet on a second chair (both braced against a wall).", "Lower until the elbows are about 90 degrees.", "Press back up to straight arms."],
    ["Support yourself on two very sturdy parallel surfaces with straight arms.", "Slowly lower over 4 seconds until the upper arms are parallel to the floor.", "Step down (or jump up) and repeat."],
    ["Support yourself on straight arms with the chest slightly forward.", "Lower until the upper arms are parallel to the floor.", "Press up to full lockout."],
    ["Support yourself on straight arms with the chest slightly forward.", "Lower to the bottom position and pause for 2 seconds, shoulders staying tight.", "Press up to full lockout."],
    ["Jump into support on a bar at hip height with your chest over it.", "Lower until your chest is near the bar.", "Press back up to straight arms."]
  ],
  pl: [
    ["Start in a push-up position with your hands turned slightly outward.", "Lean forward until your shoulders move in front of your wrists, arms locked.", "Hold, pushing the floor away and rounding the upper back slightly."],
    ["Squat down with your hands on the floor, fingers forward.", "Rest your knees on the backs of your upper arms near the elbows.", "Lean forward until your feet lift off the floor and hold. Keep a mat under your face."],
    ["From a frog stand, shift forward and lift the hips to shoulder height.", "Straighten the arms and flatten the back, knees tucked close.", "Hold, with shoulders pushing forward and down."],
    ["Start in a tuck planche.", "Open the hips so the back is flat and the knees move away from the chest.", "Hold with locked arms."],
    ["Start from an advanced tuck planche.", "Extend the legs wide and straight in a straddle.", "Hold with the body flat and arms locked."],
    ["From a straddle planche, bring the legs together.", "Keep the body straight and horizontal with the shoulders far forward.", "Hold briefly and rest for a long time between attempts."]
  ],
  pull: [
    ["Lie on your back under a very sturdy table and grip the edge shoulder-width apart.", "Bend your knees and lift the hips so the body is straight from the knees to the shoulders.", "Pull your chest to the table edge, squeeze the shoulder blades, and lower slowly."],
    ["Set up under the table as before, but straighten the legs with heels on the floor.", "Keep the body in one straight line.", "Pull the chest to the edge and lower slowly."],
    ["Set up under the table with your feet on a chair so the body is horizontal.", "Keep the body in one straight line.", "Pull the chest to the edge and lower slowly."],
    ["Hang from a bar with straight arms.", "Without bending the elbows, pull the shoulder blades down so the body lifts a few centimetres.", "Relax back to the hang and repeat."],
    ["Jump or step up so your chin is over the bar.", "Lower yourself slowly over 5 seconds to a full hang.", "Step back up and repeat."],
    ["Hang from the bar with an overhand grip, shoulder-width, arms straight.", "Pull your elbows down toward the ribs until your chin passes the bar.", "Lower all the way to a straight-arm hang."],
    ["Hang with a grip slightly wider than shoulder-width.", "Pull the chest toward the bar, elbows going down and out.", "Lower fully to a straight-arm hang."],
    ["Hang and lift your straight legs in front of you.", "Keeping the legs up, pull until your chin passes the bar.", "Lower with control without swinging."],
    ["Hang with a wide grip.", "Pull toward one hand while the other arm stays straight.", "Lower and alternate sides."],
    ["Hang with active shoulders.", "Pull as fast and high as you can, aiming your lower chest at the bar.", "Lower under control into a hang."],
    ["Use a box to get to the top, above the bar in support.", "Lean forward and lower slowly through the transition.", "Continue lowering to a full hang over 5 seconds."],
    ["Hang with a false grip (wrists over the bar).", "Pull explosively until the bar reaches your chest, then lean over it.", "Rotate the elbows over and press out to a straight-arm support."]
  ],
  fl: [
    ["Hang from the bar with straight arms.", "Pull the shoulder blades down away from your ears.", "Hold with the ribs in and the legs together."],
    ["Hang from the bar, then pull your knees to your chest.", "Lift the hips until your back is horizontal while the arms stay straight.", "Hold, then lower with control."],
    ["Start in a tuck front lever.", "Open the hips so the back is flat and the knees move away from the chest.", "Hold with straight arms."],
    ["Start in an advanced tuck front lever.", "Extend one leg straight while the other stays tucked.", "Hold and switch legs between sets."],
    ["Start in a one-leg front lever.", "Extend both legs wide and straight in a straddle.", "Hold with the body horizontal."],
    ["From a straddle front lever, bring the legs together.", "Keep the body fully straight and horizontal.", "Hold briefly, then rest for a long time."]
  ],
  legs: [
    ["Stand holding a counter or chair back, feet shoulder-width.", "Sit your hips back and down with the knees over the toes and chest up.", "Push through the whole foot to stand."],
    ["Stand with feet shoulder-width, toes slightly out, arms forward.", "Sit down and back until the thighs are parallel (or deeper), heels staying down.", "Stand up by pushing the floor away."],
    ["Stand tall and step one foot back about a stride.", "Lower the back knee toward the floor with the front shin vertical.", "Push through the front heel to stand and alternate legs."],
    ["Put your rear foot on a chair behind you and step the front foot a big stride forward.", "Lower the back knee toward the floor.", "Drive through the front heel to stand."],
    ["Stand with feet wide and toes slightly out.", "Shift onto one leg and sit down while the other leg straightens with the toes up.", "Push back to the centre and switch sides."],
    ["Stand in front of a chair on one leg with the other leg extended forward.", "Lower slowly until you lightly touch the chair.", "Stand up on one leg."],
    ["Stand on one leg and hold the other foot behind you.", "Lower the back knee to a folded mat.", "Stand back up."],
    ["Stand on one leg with the other leg extended forward and arms out front.", "Lower all the way down with your heel flat.", "Stand up on the one leg."]
  ],
  post: [
    ["Lie on your back with the knees bent and the feet flat, hip-width apart.", "Push through the heels and lift the hips until the body is straight from the shoulders to the knees.", "Squeeze the glutes, pause, then lower."],
    ["Lie face down with your arms extended forward.", "Lift the arms, chest and legs a few centimetres off the floor.", "Squeeze the glutes and upper back, hold, and breathe."],
    ["Stand on one leg with a soft knee.", "Hinge forward as the other leg extends behind you, reaching toward the floor with a flat back.", "Squeeze the glute to stand back up."],
    ["Lie on your back with one foot flat and the other leg extended.", "Lift the hips so they stay level.", "Lower slowly."],
    ["Lie on your back with your heels on a towel on a smooth floor and the hips lifted.", "Slide the heels out slowly while keeping the hips up.", "Curl the heels back in."],
    ["Kneel on a pad with your feet anchored under a sofa and the body straight from the knees to the head.", "Lower forward as slowly as possible.", "Catch yourself with your hands and push back up."],
    ["Kneel on a pad with your feet anchored and the body straight.", "Lower forward slowly, resisting with the hamstrings.", "Pull yourself back up with the hamstrings, using the hands only if needed."]
  ],
  calves: [
    ["Stand with your feet hip-width, holding a wall lightly.", "Rise onto the balls of your feet and pause.", "Lower slowly all the way down."],
    ["Stand on one foot, fingertips on a wall for balance.", "Rise as high as you can and pause.", "Lower slowly. Switch sides."],
    ["Stand on one foot with the ball of the foot on a stair edge and the heel hanging off.", "Lower the heel below the step for a full stretch.", "Rise all the way up, then repeat."],
    ["Stand on one foot on a stair edge.", "Rise for 3 seconds and pause.", "Lower for 3 seconds. Switch sides."],
    ["Stand tall with your feet together on a soft floor.", "Hop in place using only the ankles, on the balls of the feet.", "Keep the hops small and quick with stiff ankles."]
  ],
  core: [
    ["Lie on your back with your arms up and your knees bent at 90 degrees above the hips.", "Press your lower back into the floor.", "Lower the opposite arm and leg slowly, return, and alternate."],
    ["Place your forearms on the floor with the elbows under the shoulders and the knees down.", "Make a straight line from the knees to the head and squeeze the glutes.", "Hold and breathe steadily."],
    ["Place your forearms on the floor with the legs straight and toes down.", "Squeeze the glutes and quads and tuck the pelvis slightly.", "Hold with steady breathing."],
    ["Lie on your back and press the lower back into the floor.", "Lift the shoulders and straight legs a few centimetres with the arms overhead.", "Hold with the lower back down. Bend the knees if it lifts."],
    ["Lie on your back with your hands under the hips and legs straight.", "Lift the legs to vertical.", "Lower slowly to just above the floor."],
    ["Hang from a bar with straight arms.", "Curl the knees up toward the chest without swinging.", "Lower slowly."],
    ["Sit between two chairs (or on the floor) with the hands beside the hips.", "Press down and lift the hips and tucked knees off the floor.", "Hold with the shoulders pressed down."],
    ["Hang from a bar with straight arms.", "Raise straight legs up to bar height.", "Lower slowly without swinging."],
    ["Lie on a bench and hold the bench behind your head.", "Lift your body straight up onto your shoulders.", "Lower in one straight line over 5 seconds."],
    ["Sit with your hands beside the hips and legs straight.", "Press down and lift the hips and legs so they are parallel to the floor.", "Hold with the shoulders pressed down."]
  ],
  obl: [
    ["Lie on one side with your forearm under the shoulder and knees bent.", "Lift the hips so the shoulders, hips and knees line up.", "Hold, then switch sides."],
    ["Lie on one side with your forearm under the shoulder and legs straight.", "Lift the hips so the body is one straight line.", "Hold, then switch sides."],
    ["Get into a side plank with your forearm under the shoulder.", "Lower the hip a few centimetres toward the floor.", "Lift it back up and repeat, then switch sides."],
    ["Lie on your side with your top knee on a chair and the bottom leg hanging.", "Lift the hips so the body is straight.", "Hold, then switch sides."],
    ["Lie on your side with your top foot on a chair and the bottom leg lifted.", "Lift the hips so the body is straight.", "Hold, then switch sides."],
    ["Lie on your back with your arms out and legs straight up.", "Sweep both legs slowly to one side, stopping before the lower back lifts.", "Bring them back up and sweep to the other side."],
    ["Grip a vertical pole with both hands, one high and one low.", "Press the bottom arm and pull the top arm to lift your knees off the floor.", "Hold, then lower slowly. Switch sides."],
    ["Grip a vertical pole with both hands, one high and one low.", "Lift the whole body into a straight horizontal line.", "Hold, then lower slowly. Switch sides."]
  ],
  flex: [
    ["Stand with your feet shoulder-width and toes slightly out.", "Sit down into a deep squat with the heels flat and the knees pushing out.", "Hold with the chest tall, using a post for balance if needed."],
    ["Sit on the floor with your legs straight.", "Hinge forward from the hips with a long spine.", "Hold where you feel a stretch, never sharp pain."],
    ["Kneel with your back shin against a couch or wall.", "Step the other foot forward and tuck the pelvis, squeezing the back glute.", "Hold, then switch sides."],
    ["Place your hands on a wall or chair above your head with the arms straight.", "Sink the chest toward the floor with the ribs staying down.", "Hold at a stretch, not a pinch."],
    ["Start on all fours and slide one shin forward across your body.", "Extend the back leg long behind you.", "Fold forward over the front leg and hold. Switch sides."],
    ["Sit with your legs wide in a straddle.", "Hinge forward from the hips and walk your hands forward.", "Hold at a comfortable stretch."],
    ["Place your hands on blocks or books on both sides of you.", "Slide the front heel forward and the back knee back, keeping the hips square.", "Sink gradually and hold. Switch sides."],
    ["Lie on your back with the knees bent and feet flat, hands by the ears.", "Press through the hands and feet to lift into an arch.", "Push the chest toward the wall behind you, hold, then lower slowly."]
  ]
};
if (typeof module !== 'undefined') module.exports = STEPS;
