During the interview, multiple signals are monitored.

The first is face presence.

The system checks whether the expected candidate is visible.

If the face disappears for a meaningful period of time, the system can generate an event.

The second is multiple-face detection.

If another face appears in the camera frame, the system records that as an integrity signal.

The third is face orientation and related visual signals.

These signals help understand whether the candidate is consistently present and behaving normally within the interview environment.

Next, we monitor browser tab activity.

If the candidate moves away from the interview tab, InterviewShield can detect the visibility change.

We don't simply say, candidate cheated. Instead, we record, tab hidden.

That distinction matters. A detection is an observation, not a verdict.

We also monitor screen sharing.

If screen sharing is enabled, the state is recorded.

If the candidate stops screen sharing during a monitored session, that transition becomes another event.

Then we have the audio layer.

InterviewShield monitors audio activity without needing to turn the system into a speech-recognition platform.

We are interested in signals such as speech activity and extended silence.

Finally, we have our audio-visual correlation layer.

This allows us to correlate audio activity with visual signals rather than treating every individual signal independently.

The purpose is not to make an accusation from a single event. The purpose is to identify combinations of signals that deserve attention.

This is one of the most important parts of the system.

InterviewShield does not simply collect a giant recording and ask an AI model to analyze everything later.

Instead, the system follows an event-driven architecture.

For example, a tab change occurs.

The detector generates an event.

The event enters the event buffer.

It is transmitted through the WebSocket layer.

The backend validates and stores the event.

The risk engine processes it.

And the recruiter dashboard can then display it in the interview timeline.

The same architecture applies to other supported signals.

This gives us a structured representation of what happened during the interview.

Instead of having forty-five minutes of video, we can have forty-five minutes of interview plus a structured integrity timeline.

That makes investigation dramatically faster.

Now let's talk about the risk engine.

InterviewShield converts relevant integrity signals into a risk state.

But we deliberately avoid the dangerous approach of saying, AI has decided that this candidate cheated.

Instead, the risk score is explainable.

For example, the recruiter might see: tab hidden, multiple faces, screen sharing stopped, face temporarily absent, and audio-visual inconsistency.

Each event contributes according to the system's configured logic.

The recruiter can therefore understand why the risk state changed.

This makes the system auditable.

And more importantly, it keeps the human recruiter in control.

InterviewShield is an assistance system, not an automated hiring judge.

Now we come to one of the strongest parts of the product.

Evidence.

When a relevant event occurs, InterviewShield can associate supporting evidence with that event.

The recruiter doesn't have to search manually through the entire interview.

Instead, the system creates a structured timeline.

For example, at ten fourteen, tab hidden. At ten sixteen, multiple faces detected. At ten eighteen, screen sharing stopped.

The recruiter can select an event and inspect the associated evidence.

This changes the workflow from, watch everything and look for something suspicious, to, review the moments that actually require attention.

That is a major difference.

Now let's move to the recruiter side.

The recruiter dashboard brings everything together.

At a glance, the recruiter can see the interview's current integrity state.

Then the recruiter can move deeper into the timeline, risk history, evidence, and session information.

And finally, human review.

The dashboard is designed around progressive disclosure.

The recruiter first gets the high-level state.

If something looks unusual, they can drill down.

They don't need to understand the underlying machine-learning or WebSocket architecture.

The complexity stays inside the system. The interface stays understandable.

This is where our philosophy becomes important.