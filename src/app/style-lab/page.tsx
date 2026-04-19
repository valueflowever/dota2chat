import styles from "./style-lab.module.css";

const previewMessages = [
  {
    role: "assistant" as const,
    label: "分析助手",
    content:
      "先说结论：这局不是纯操作没打过，而是 Roshan 前后的节奏管理断了。",
  },
  {
    role: "user" as const,
    label: "你",
    content: "我想先看 Roshan 前后的处理。",
  },
  {
    role: "assistant" as const,
    label: "分析助手",
    content:
      "因为你们每次进关键区域前都少了一层准备，到了 Roshan 才一起爆掉。",
  },
];

const previewConversations = [
  "8123456789 / Solo Queue",
  "中单节奏怎么修",
  "Roshan 前的决策链",
];

function PreviewCard({
  direction,
  subtitle,
  summary,
  accent,
  actionLabel,
}: {
  direction: string;
  subtitle: string;
  summary: string;
  accent: "linear" | "notion";
  actionLabel: string;
}) {
  return (
    <article className={`${styles.variant} ${styles[accent]}`}>
      <div className={styles.variantHeader}>
        <div className={styles.variantTitleWrap}>
          <p className={styles.variantEyebrow}>{direction}</p>
          <h2 className={styles.variantTitle}>{subtitle}</h2>
          <p className={styles.variantMeta}>{summary}</p>
        </div>
        <span className={styles.variantPick}>
          {accent === "linear" ? "更硬的产品感" : "更柔和的文档感"}
        </span>
      </div>

      <div className={styles.variantBody}>
        <div className={styles.previewApp}>
          <aside className={styles.previewSidebar}>
            <div className={styles.previewSidebarTop}>
              <div className={styles.previewBrandRow}>
                <div className={styles.previewBrandGlyph} />
                <span className={styles.previewBrand}>Ancient Lens</span>
              </div>
              <button type="button" className={styles.previewNewButton}>
                新对话
              </button>
            </div>

            <div className={styles.previewConversationList}>
              {previewConversations.map((item) => (
                <button
                  key={`${accent}-${item}`}
                  type="button"
                  className={`${styles.previewConversationItem} ${
                    item === "比赛 8123456789" ? styles.previewConversationItemActive : ""
                  }`}
                >
                  <span className={styles.previewConversationTitle}>{item}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.previewStage}>
            <div className={styles.previewContextBar}>
              <span className={styles.previewChip}>比赛 8123456789</span>
              <span className={styles.previewChip}>录像复盘</span>
              <span className={styles.previewChip}>demo-engine</span>
            </div>

            <div className={styles.previewMessages}>
              {previewMessages.map((message) => (
                <article
                  key={`${accent}-${message.label}-${message.content}`}
                  className={`${styles.previewMessageRow} ${
                    message.role === "user"
                      ? styles.previewMessageRowUser
                      : styles.previewMessageRowAssistant
                  }`}
                >
                  <div
                    className={`${styles.previewMessageBubble} ${
                      message.role === "user"
                        ? styles.previewMessageBubbleUser
                        : styles.previewMessageBubbleAssistant
                    }`}
                  >
                    <span className={styles.previewMessageLabel}>{message.label}</span>
                    <p className={styles.previewMessageCopy}>{message.content}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.previewDock}>
              <div className={styles.previewFollowUpBlock}>
                <span className={styles.previewFollowUpTitle}>继续追问</span>
                <div className={styles.previewFollowUpList}>
                  <button type="button" className={styles.previewFollowUpChip}>
                    这局为什么会输？
                  </button>
                  <button type="button" className={styles.previewFollowUpChip}>
                    下一把先改什么？
                  </button>
                </div>
              </div>

              <div className={styles.previewComposer}>
                <span className={styles.previewComposerCopy}>
                  继续问这场比赛，比如：高地前到底哪里脱节了？
                </span>
                <button type="button" className={styles.previewComposerButton}>
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.variantFooter}>
        <button type="button" className={styles.selectButton}>
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

export default function StyleLabPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Ancient Lens Style Lab</p>
          <h1 className={styles.title}>Linear 风 vs Notion 风</h1>
          <p className={styles.subtitle}>
            临时比较页，只用于选正式界面的视觉方向。两张卡使用同一套聊天工作台骨架，
            只比较风格，不比较结构。
          </p>
        </header>

        <section className={styles.grid}>
          <PreviewCard
            direction="Direction A / Linear"
            subtitle="更像协作工具的硬朗工作台"
            summary="边界更明确、层级更薄、色彩更克制，适合更硬的产品感。"
            accent="linear"
            actionLabel="选择 Linear 风"
          />

          <PreviewCard
            direction="Direction B / Notion"
            subtitle="更像文档产品的柔和工作台"
            summary="留白更多、纸面感更强、阅读氛围更轻，适合更柔和的文档感。"
            accent="notion"
            actionLabel="选择 Notion 风"
          />
        </section>
      </div>
    </main>
  );
}
