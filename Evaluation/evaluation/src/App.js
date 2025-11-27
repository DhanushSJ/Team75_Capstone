import { useMemo, useState } from 'react';
import './App.css';

const evaluationCriteria = [
  'Pharser Check',
  'Image Check',
  'Quality Check',
  'Novelty',
  'Technical Soundess',
];

const scoreOptions = Array.from({ length: 10 }, (_, index) => index + 1);

function App() {
  const previewSrc =
    encodeURI('/6_report - tanishka pasarad.pdf') + '#toolbar=0&navpanes=0';

  const randomScores = useMemo(
    () =>
      evaluationCriteria.map(
        () => Math.floor(Math.random() * scoreOptions.length) + 1
      ),
    []
  );

  const [mentorScores, setMentorScores] = useState(
    evaluationCriteria.map(() => '')
  );

  const handleMentorScoreChange = (rowIndex, value) => {
    setMentorScores((previous) => {
      const next = [...previous];
      next[rowIndex] = value;
      return next;
    });
  };

  const totalScore = useMemo(
    () => randomScores.reduce((sum, score) => sum + score, 0),
    [randomScores]
  );

  const totalMentorScore = useMemo(
    () =>
      mentorScores.reduce((sum, score) => {
        const numeric = Number.parseInt(score, 10);
        if (Number.isNaN(numeric)) {
          return sum;
        }
        return sum + numeric;
      }, 0),
    [mentorScores]
  );

  return (
    <div className="App">
      <header className="App-header">
        <img
          src="/logoPesu.png"
          className="College-logo"
          alt="PES University logo"
        />
        <div className="App-title">
          <h1>Evaluation Portal</h1>
        </div>
      </header>
      <main className="App-main">
        <section className="Preview-panel">
          <h2>6_report - tanishka pasarad.pdf</h2>
          <iframe
            src={previewSrc}
            title="Evaluation preview"
            className="Preview-frame"
          />
        </section>
        <section className="Evaluation-panel">
          <h2>Evaluation Table</h2>
          <table className="Evaluation-table">
            <thead>
              <tr>
                <th>Criteria</th>
                <th>Score</th>
                <th>Mentor Score</th>
              </tr>
            </thead>
            <tbody>
              {evaluationCriteria.map((criterion, index) => (
                <tr key={criterion}>
                  <td>{criterion}</td>
                  <td className="Score-cell">
                    <span className="Score-value">{randomScores[index]}</span>
                  </td>
                  <td className="Mentor-score-cell">
                    <select
                      className="Mentor-select"
                      value={mentorScores[index]}
                      onChange={(event) =>
                        handleMentorScoreChange(index, event.target.value)
                      }
                    >
                      {scoreOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="Totals-row">
                <th scope="row">Total</th>
                <td>{totalScore}</td>
                <td>{totalMentorScore}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </main>
      <button type="button" className="Submit-fab">
        Submit
      </button>
    </div>
  );
}

export default App;
