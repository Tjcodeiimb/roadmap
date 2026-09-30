// Static "lab" frames of every rebuilt screen, rendered as stills and compared with the app's code
// before anything is animated.
import { AbsoluteFill } from 'remotion';
import { FontGate } from './lib/FontGate';
import { C } from './theme';
import { FEED, PHASES, PICK, RESUME, SKILL, WEEK_SKILLS } from './data';
import { CourseBanner, CourseCard, ResourceCard, ResumePage, SkillGroupHeader, SkillPicker, SkillTile, SkillUnlock, TopicHeader, TopicRow, Toast, XPWidget } from './ui';
import { COPY, copySize, Page, Screen, StampLabel, StampTag, TapCursor, WeekStrip } from './chrome';

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FontGate>
    <AbsoluteFill style={{ background: C.paper }}>{children}</AbsoluteFill>
  </FontGate>
);

export const LabMarket: React.FC = () => (
  <Frame>
    <WeekStrip states={['today', 'future', 'future', 'future', 'future', 'future', 'future']} appear={[1, 1, 1, 1, 1, 1, 1]} pops={[0, 0, 0, 0, 0, 0, 0]} />
    <Page>
      <StampLabel lines={COPY.mon} size={copySize()} t={20} y={260} />
      <StampTag text="29 courses · all free" t={20} x={60} y={440} />
      <Screen y={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CourseCard course={FEED[2]} />
          <CourseCard course={PICK} />
        </div>
      </Screen>
      <TapCursor x={860} y={1500} press={0.4} show={1} />
    </Page>
  </Frame>
);

export const LabTopic: React.FC = () => (
  <Frame>
    <Page>
      <StampLabel lines={COPY.tue} size={copySize()} t={20} y={260} />
      <Screen y={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: '"Archivo Variable"' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3 }}>Excel for Finance · Excel Foundations for Finance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, lineHeight: 1.15 }}>{PHASES[0].topics[0].title}</div>
          <TopicHeader status="active" done={1} total={2} />
          <ResourceCard r={PHASES[0].topics[0].resources[0]} status="done" />
          <ResourceCard r={PHASES[0].topics[0].resources[1]} status="in_progress" />
          <ResourceCard r={PHASES[0].topics[1].resources[0]} status="todo" />
        </div>
      </Screen>
    </Page>
  </Frame>
);

export const LabRoadmap: React.FC = () => (
  <Frame>
    <Page>
      <StampLabel lines={COPY.wed} size={copySize()} t={20} y={260} />
      <Screen y={640}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CourseBanner done={2} active={1} total={35} color={C.accent} />
          <TopicRow title={PHASES[0].topics[0].title} status="done" done={2} total={2} />
          <TopicRow title={PHASES[0].topics[1].title} status="active" done={2} total={3} />
          <TopicRow title={PHASES[1].topics[0].title} status="next" done={0} total={3} />
          <TopicRow title={PHASES[1].topics[1].title} status="todo" done={0} total={4} />
        </div>
      </Screen>
    </Page>
  </Frame>
);

export const LabSkill: React.FC = () => (
  <Frame>
    <Page>
      <StampLabel lines={COPY.fri} size={copySize()} t={20} y={260} />
      <Screen y={520} x={108}>
        <SkillUnlock {...SKILL} unlocked />
      </Screen>
      <Screen y={1480}>
        <XPWidget xp={560} streak={5} />
      </Screen>
    </Page>
  </Frame>
);

export const LabSkills: React.FC = () => (
  <Frame>
    <Page>
      <Screen y={400}>
        <SkillGroupHeader label="Excel for Finance" count="4/36" pct={11} />
        <div style={{ border: `2px solid ${C.ink}`, borderRadius: '0 0 6px 6px', background: C.paper, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WEEK_SKILLS.map((s) => (
            <SkillTile key={s} name={s} />
          ))}
        </div>
      </Screen>
    </Page>
  </Frame>
);

export const LabResume: React.FC = () => (
  <Frame>
    <Page>
      <StampLabel lines={COPY.sat} size={copySize()} t={20} y={260} />
      <Screen y={640}>
        <ResumePage skills={[...RESUME.skills, SKILL.name]} flash={0.8} />
      </Screen>
      <Screen y={1100}>
        <SkillPicker skills={WEEK_SKILLS} selected={SKILL.name} />
      </Screen>
      <div style={{ position: 'absolute', left: 300, top: 1800, zoom: 2.4 }}>
        <Toast text="Enrolled in Excel for Finance ✓" />
      </div>
    </Page>
  </Frame>
);
