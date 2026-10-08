import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { chapters, getChapter, getChapterIndex } from '../../data/textbook/chapters';
import Sandbox from './Sandbox';
import styles from './Textbook.module.css';

// Renders one block of a chapter. Chapters are data (see data/textbook/chapters.js);
// this maps each block type to a component.
const Block = ({ block }) => {
  if (block.type === 'prose') {
    return (
      <div className={styles.tbProse}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {block.md}
        </ReactMarkdown>
      </div>
    );
  }
  if (block.type === 'sandbox') {
    return (
      <Sandbox
        words={block.words}
        addable={block.addable}
        caption={block.caption}
      />
    );
  }
  return null;
};

const Textbook = () => {
  const { chapter: slug } = useParams();
  const navigate = useNavigate();

  const chapter = getChapter(slug);
  const index = getChapterIndex(chapter.slug);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  return (
    <div className={styles.tbPage}>
      <div className={styles.tbContent}>
        <Link to="/app" className={styles.tbExplorerLink}>
          ← Open explorer
        </Link>

        {chapter.subtitle && <p className={styles.tbEyebrow}>{chapter.subtitle}</p>}
        <h1 className={styles.tbTitle}>{chapter.title}</h1>

        {chapter.blocks.map((block, i) => (
          <Block key={`${chapter.slug}-${i}`} block={block} />
        ))}

        <div className={styles.tbNav}>
          {prev ? (
            <button
              className={styles.tbNavBtn}
              onClick={() => navigate(`/learn/${prev.slug}`)}
            >
              ← {prev.title}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              className={styles.tbNavBtn}
              onClick={() => navigate(`/learn/${next.slug}`)}
            >
              {next.title} →
            </button>
          ) : (
            <span className={styles.tbNavEnd}>More chapters coming soon</span>
          )}
        </div>
      </div>

    </div>
  );
};

export default Textbook;
