import React, { useState, useEffect, useRef } from 'react';
import './Study.css';

const Study = () => {
  // track all named decks in localStorage
  const [decks, setDecks] = useState(() => {
    try {
      const saved = localStorage.getItem('kirtanFlashcardDecks');
      return saved ? JSON.parse(saved) : { Default: [] };
    } catch (e) {
      return { Default: [] };
    }
  });
  
  const [currentDeckName, setCurrentDeckName] = useState(Object.keys(decks)[0] || 'Default');
  const [flashcards, setFlashcards] = useState([]);
  
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [mode, setMode] = useState('create');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [activeDeck, setActiveDeck] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [timerType, setTimerType] = useState('none');
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testAnswer, setTestAnswer] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [choices, setChoices] = useState([]);
  const [testStarted, setTestStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const cardRef = useRef(null);
  const isInitialMount = useRef(true);

  // Load flashcards when currentDeckName changes
  useEffect(() => {
    const deckCards = decks[currentDeckName] || [];
    setFlashcards(deckCards);
    setCurrentIndex(0);
    setFlipped(false);
    setActiveDeck([]);
    setMode('create');
    setEditingIndex(null);
    setFront('');
    setBack('');
    setChoices([]);
    setIsMultipleChoice(false);
    setTestStarted(false);
    setSearchTerm('');
  }, [currentDeckName]);

  // Save to localStorage when decks change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('kirtanFlashcardDecks', JSON.stringify(decks));
    }
  }, [decks]);

  // Update decks when flashcards change
  useEffect(() => {
    if (currentDeckName) {
      setDecks(prevDecks => ({
        ...prevDecks,
        [currentDeckName]: flashcards
      }));
    }
  }, [flashcards, currentDeckName]);

  // Timer effect
  useEffect(() => {
    if (mode !== 'test' || !testStarted || timerType === 'none' || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
        clearInterval(interval);
        if (timerType === 'perQuestion') {
            handleTimeout();  // This moves to next card
        } else {
            handleTimeout();  // ← CHANGE THIS - also move to next card
        }
        return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft, mode, testStarted, timerType]);

  const handleTimeout = () => {
    if (currentIndex < activeDeck.length - 1) {
      setTimeout(() => {
        nextCard();
      }, 500);
    } else {
      endTest();
    }
  };

  const addFlashcard = () => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    if (!trimmedFront || !trimmedBack) {
      alert('Front and back are required!');
      return;
    }
    
    let newCard = { 
      front: trimmedFront, 
      back: trimmedBack,
      id: Date.now() + Math.random()
    };

    if (isMultipleChoice) {
      const filteredChoices = choices.map(c => c.trim()).filter(c => c !== '');
      if (filteredChoices.length < 2) {
        alert('At least 2 choices required for multiple choice!');
        return;
      }
      if (!filteredChoices.includes(trimmedBack)) {
        alert('Answer must match one of the choices exactly!');
        return;
      }
      newCard = {
        ...newCard,
        type: 'multiple',
        choices: filteredChoices,
        correctIndex: filteredChoices.findIndex(c => c === trimmedBack),
      };
    } else {
      newCard.type = 'written';
    }

    if (editingIndex !== null) {
      setFlashcards(prev => {
        const copy = [...prev];
        copy[editingIndex] = newCard;
        return copy;
      });
      setEditingIndex(null);
    } else {
      setFlashcards(prev => [newCard, ...prev]);
    }
    
    setFront('');
    setBack('');
    setChoices([]);
    setIsMultipleChoice(false);
  };

  const addChoice = () => setChoices([...choices, '']);
  
  const removeChoice = (index) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const deleteCard = (index) => {
    if (window.confirm('Delete this card?')) {
      const newDeck = flashcards.filter((_, i) => i !== index);
      setFlashcards(newDeck);
      if (currentIndex >= newDeck.length) {
        setCurrentIndex(Math.max(0, newDeck.length - 1));
      }
    }
  };

  const editCard = (index) => {
    const card = flashcards[index];
    setFront(card.front);
    setBack(card.back);
    if (card.type === 'multiple') {
      setIsMultipleChoice(true);
      setChoices(card.choices || []);
    } else {
      setIsMultipleChoice(false);
      setChoices([]);
    }
    setEditingIndex(index);
    setMode('create');
  };

  const clearAll = () => {
    if (window.confirm('Delete all cards in this deck?')) {
      setFlashcards([]);
      setMode('create');
    }
  };

  const startViewMode = () => {
    if (flashcards.length === 0) {
      alert('Add some cards first!');
      return;
    }
    const order = shuffle ? [...flashcards].sort(() => Math.random() - 0.5) : [...flashcards];
    setActiveDeck(order);
    setMode('view');
    setCurrentIndex(0);
    setFlipped(false);
  };

  const startTestMode = () => {
    if (flashcards.length === 0) {
      alert('Add some cards first!');
      return;
    }
    const order = shuffle ? [...flashcards].sort(() => Math.random() - 0.5) : [...flashcards];
    setActiveDeck(order);
    setMode('test');
    setCurrentIndex(0);
    setScore(0);
    setTestAnswer('');
    setTestStarted(true);
    setShowResults(false);
    resetTimer();
  };

  const resetTimer = () => {
    if (timerType === 'perQuestion') {
      setTimeLeft(timeLimit);
    } else if (timerType === 'total') {
      setTimeLeft(timeLimit * 60);
    } else {
      setTimeLeft(0);
    }
  };

  // Function to apply timer changes during test
  const applyTimerChanges = () => {
    if (testStarted) {
      resetTimer();
    }
  };

  // Handle timer type change
  const handleTimerTypeChange = (newType) => {
    setTimerType(newType);
    setTimeout(() => {
      applyTimerChanges();
    }, 0);
  };

  // Handle time limit change
  const handleTimeLimitChange = (newLimit) => {
    setTimeLimit(newLimit);
    setTimeout(() => {
      applyTimerChanges();
    }, 0);
  };

  const createDeck = () => {
    const name = prompt('Enter new deck name:');
    if (!name) return;
    if (decks[name]) {
      alert('A deck with that name already exists');
      return;
    }
    setDecks(prev => ({ ...prev, [name]: [] }));
    setCurrentDeckName(name);
  };

  const renameDeck = () => {
    const name = prompt('Rename deck to:', currentDeckName);
    if (!name || name === currentDeckName) return;
    if (decks[name]) {
      alert('A deck with that name already exists');
      return;
    }
    setDecks(prev => {
      const { [currentDeckName]: cards, ...others } = prev;
      return { ...others, [name]: cards };
    });
    setCurrentDeckName(name);
  };

  const deleteDeck = () => {
    if (!window.confirm(`Delete deck "${currentDeckName}"?`)) return;
    setDecks(prev => {
      const { [currentDeckName]: _, ...others } = prev;
      return Object.keys(others).length ? others : { Default: [] };
    });
    const nextDeck = Object.keys(decks).find(k => k !== currentDeckName) || 'Default';
    setCurrentDeckName(nextDeck);
  };

  const exportDeck = () => {
    const data = JSON.stringify(flashcards, null, 2);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(data).then(() => {
        alert('Deck JSON copied to clipboard!');
      });
    } else {
      prompt('Copy this JSON:', data);
    }
  };

  const importDeck = () => {
    const json = prompt('Paste deck JSON here:');
    if (!json) return;
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) throw new Error();
      const name = prompt('Name for imported deck:', 'Imported');
      if (!name) return;
      setDecks(prev => ({ ...prev, [name]: arr }));
      setCurrentDeckName(name);
    } catch {
      alert('Invalid deck JSON format');
    }
  };

  const endTest = () => {
    setTestStarted(false);
    setShowResults(true);
  };

  const flipCard = () => {
    if (mode === 'view') {
      setFlipped(!flipped);
    }
  };

  const nextCard = () => {
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setTestAnswer('');
      if (timerType === 'perQuestion') {
        setTimeLeft(timeLimit);
      }
    } else {
      if (mode === 'test') {
        endTest();
      } else {
        setMode('create');
      }
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setTestAnswer('');
      if (timerType === 'perQuestion') {
        setTimeLeft(timeLimit);
      }
    }
  };

  const submitTestAnswer = () => {
    if (!testStarted) return;
    
    const card = activeDeck[currentIndex];
    let isCorrect = false;
    
    if (card.type === 'multiple') {
      isCorrect = Number(testAnswer) === card.correctIndex;
    } else {
      isCorrect = testAnswer.trim().toLowerCase() === card.back.trim().toLowerCase();
    }
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    if (currentIndex === activeDeck.length - 1) {
      endTest();
    } else {
      nextCard();
    }
  };

  const restartTest = () => {
    const order = shuffle ? [...flashcards].sort(() => Math.random() - 0.5) : [...flashcards];
    setActiveDeck(order);
    setCurrentIndex(0);
    setScore(0);
    setTestAnswer('');
    setTestStarted(true);
    setShowResults(false);
    resetTimer();
  };

  const deckInUse = (mode === 'view' || mode === 'test') ? activeDeck : flashcards;
  const currentCard = deckInUse[currentIndex] || {};
  
  const filteredFlashcards = flashcards.filter(card => 
    card.front?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.back?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeckChange = (e) => {
    setCurrentDeckName(e.target.value);
  };

  return (
    <div className="study-container">
      <div className="title-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="title-card-content">
          <h1 className="main-title">
            <span className="title-word">STUDY </span>
            <span className="title-word gradient">FLASHCARDS</span>
          </h1>
          <div className="title-decoration">
            <span className="dot"></span>
            <span className="line"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="title-card-bg">
          <div className="bg-shape shape1"></div>
          <div className="bg-shape shape2"></div>
          <div className="bg-shape shape3"></div>
        </div>
      </div>

      <div className="deck-controls">
        <select
          value={currentDeckName}
          onChange={handleDeckChange}
          className="deck-select"
        >
          {Object.keys(decks).map((name) => (
            <option key={name} value={name}>
              {name} ({decks[name].length} cards)
            </option>
          ))}
        </select>
        <button onClick={createDeck} className="small-btn primary">
          + New Deck
        </button>
        <button onClick={renameDeck} className="small-btn">
          Rename
        </button>
        <button onClick={deleteDeck} className="small-btn danger">
          Delete
        </button>
        <button onClick={exportDeck} className="small-btn">
          Export
        </button>
        <button onClick={importDeck} className="small-btn">
          Import
        </button>
      </div>

      {mode === 'create' && (
        <div className="create-layout">
          <div className="create-section">
            <div className="create-form card">
              <h2 className="form-title">
                {editingIndex !== null ? '✎ Edit Card' : '➕ Create New Card'}
              </h2>
              
              <div className="input-group">
                <label>Question (Front)</label>
                <textarea
                  placeholder="e.g., What is the capital of France?"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="input-group">
                <label>Answer (Back)</label>
                <textarea
                  placeholder="e.g., Paris"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="mc-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isMultipleChoice}
                    onChange={(e) => setIsMultipleChoice(e.target.checked)}
                  />
                  <span className="toggle-text">Multiple Choice</span>
                </label>
              </div>

              {isMultipleChoice && (
                <div className="choices-section">
                  <h4>Answer Choices</h4>
                  <p className="choices-hint">Make sure one choice matches your answer above</p>
                  <div className="choices-grid">
                    {choices.map((choice, i) => (
                      <div key={i} className="choice-item">
                        <input
                          type="text"
                          placeholder={`Choice ${i + 1}`}
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...choices];
                            newChoices[i] = e.target.value;
                            setChoices(newChoices);
                          }}
                          className="choice-input"
                        />
                        {choices.length > 1 && (
                          <button 
                            className="remove-choice" 
                            onClick={() => removeChoice(i)}
                            title="Remove choice"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button className="add-choice-btn" onClick={addChoice}>
                      + Add Choice
                    </button>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  onClick={addFlashcard} 
                  className="primary-btn"
                  disabled={!front.trim() || !back.trim()}
                >
                  {editingIndex !== null ? '💾 Save Card' : '➕ Add Card'}
                </button>
                
                {editingIndex !== null && (
                  <button 
                    className="secondary-btn" 
                    onClick={() => {
                      setEditingIndex(null);
                      setFront('');
                      setBack('');
                      setChoices([]);
                      setIsMultipleChoice(false);
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="deck-preview card">
              <div className="preview-header">
                <h3>📚 Your Deck · {flashcards.length} cards</h3>
                <div className="preview-actions">
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <label className="shuffle-label">
                    <input
                      type="checkbox"
                      checked={shuffle}
                      onChange={(e) => setShuffle(e.target.checked)}
                    />
                    Shuffle
                  </label>
                </div>
              </div>
              
              <div className="cards-list">
                {filteredFlashcards.length === 0 ? (
                  <p className="empty-message">
                    {searchTerm ? 'No matching cards' : 'No cards yet. Add your first card above!'}
                  </p>
                ) : (
                  filteredFlashcards.map((card, i) => {
                    const originalIndex = flashcards.findIndex(c => c.id === card.id);
                    return (
                      <div key={card.id || i} className="deck-card">
                        <div className="deck-card-content">
                          <div className="card-question">
                            <strong>Q:</strong> 
                            <span title={card.front}>
                              {card.front.length > 60 ? card.front.substring(0, 60) + '...' : card.front}
                            </span>
                          </div>
                          <div className="card-answer">
                            <strong>A:</strong> 
                            <span title={card.back}>
                              {card.back.length > 60 ? card.back.substring(0, 60) + '...' : card.back}
                            </span>
                          </div>
                          {card.type === 'multiple' && (
                            <span className="card-badge">Multiple Choice</span>
                          )}
                        </div>
                        <div className="card-actions">
                          <button className="icon-btn edit" onClick={() => editCard(originalIndex)} title="Edit">
                            ✎
                          </button>
                          <button className="icon-btn delete" onClick={() => deleteCard(originalIndex)} title="Delete">
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {flashcards.length > 0 && (
                <div className="deck-footer">
                  <button onClick={clearAll} className="clear-btn">
                    🗑️ Clear All
                  </button>
                  <div className="mode-buttons">
                    <button onClick={startViewMode} className="view-mode-btn">
                      👁️ View Mode
                    </button>
                    <button onClick={startTestMode} className="test-mode-btn">
                      ✍️ Test Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(mode === 'view' || mode === 'test') && (
        <div className="study-mode">
          <div className="mode-header">
            <div className="mode-info">
              <span className="deck-badge">{currentDeckName}</span>
              <span className="card-count">{currentIndex + 1} / {deckInUse.length}</span>
            </div>
            <button className="close-mode" onClick={() => setMode('create')}>
              ✕
            </button>
          </div>

          <div className="card-container">
            <div 
              className={`flashcard ${flipped ? 'flipped' : ''}`}
              onClick={mode === 'view' ? flipCard : undefined}
              ref={cardRef}
            >
              <div className="card-front">
                <p className="card-label">Question</p>
                <h2>{currentCard.front || 'No question'}</h2>
                {mode === 'view' && (
                  <p className="flip-hint">Click to {flipped ? 'see question' : 'see answer'}</p>
                )}
              </div>
              <div className="card-back">
                <p className="card-label">Answer</p>
                <h2>{currentCard.back || 'No answer'}</h2>
              </div>
            </div>
          </div>

          {mode === 'view' && (
            <div className="view-controls">
              <div className="nav-buttons">
                <button 
                  onClick={prevCard} 
                  disabled={currentIndex === 0}
                  className="nav-btn"
                >
                  ← Previous
                </button>
                <button 
                  onClick={nextCard}
                  className="nav-btn primary"
                >
                  {currentIndex === deckInUse.length - 1 ? 'Finish' : 'Next →'}
                </button>
              </div>
            </div>
          )}

          {mode === 'test' && !showResults && testStarted && (
            <div className="test-area">
              <div className="test-header">
                <div className="score">Score: {score}</div>
                {timerType !== 'none' && (
                  <div className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="question-box">
                <h3>{currentCard.front || 'No question'}</h3>
              </div>

              {currentCard.type === 'multiple' ? (
                <div className="multiple-choice-grid">
                  {currentCard.choices?.map((option, i) => (
                    <label key={i} className={`choice-option ${testAnswer === String(i) ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="mc"
                        value={i}
                        checked={testAnswer === String(i)}
                        onChange={(e) => setTestAnswer(e.target.value)}
                      />
                      <span className="choice-text">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="written-answer">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={testAnswer}
                    onChange={(e) => setTestAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitTestAnswer()}
                    className="answer-input"
                    autoFocus
                  />
                </div>
              )}

              <div className="test-actions">
                <button 
                  onClick={submitTestAnswer} 
                  disabled={!testAnswer && currentCard.type !== 'multiple'}
                  className="submit-btn"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          {mode === 'test' && showResults && (
            <div className="results-card">
              <h2>Test Complete! 🎉</h2>
              <div className="score-display">
                <span className="score-number">{score}</span>
                <span className="score-total">/{deckInUse.length}</span>
              </div>
              <div className="percentage">
                {Math.round((score / deckInUse.length) * 100)}% Correct
              </div>
              <div className="results-actions">
                <button onClick={restartTest} className="restart-btn">
                  🔄 Restart Test
                </button>
                <button onClick={() => setMode('create')} className="back-btn">
                  ← Back to Deck
                </button>
              </div>
            </div>
          )}

          {mode === 'test' && (
            <div className="timer-settings-panel">
              <h4>Test Settings</h4>
              <div className="timer-options">
                <label className={`timer-option ${timerType === 'none' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="timer"
                    checked={timerType === 'none'}
                    onChange={() => handleTimerTypeChange('none')}
                  />
                  No timer
                </label>
                <label className={`timer-option ${timerType === 'perQuestion' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="timer"
                    checked={timerType === 'perQuestion'}
                    onChange={() => handleTimerTypeChange('perQuestion')}
                  />
                  Per question
                </label>
                <label className={`timer-option ${timerType === 'total' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="timer"
                    checked={timerType === 'total'}
                    onChange={() => handleTimerTypeChange('total')}
                  />
                  Total time
                </label>
              </div>
              
              {timerType !== 'none' && (
                <div className="timer-input">
                  <label>
                    {timerType === 'perQuestion' ? 'Seconds per question:' : 'Minutes for test:'}
                  </label>
                  <input
                    type="number"
                    min={timerType === 'perQuestion' ? "5" : "1"}
                    max={timerType === 'perQuestion' ? "300" : "180"}
                    value={timeLimit}
                    onChange={(e) => handleTimeLimitChange(parseInt(e.target.value) || 30)}
                  />
                  {testStarted && (
                    <button onClick={resetTimer} className="apply-timer-btn btn">
                      Apply Timer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Study;