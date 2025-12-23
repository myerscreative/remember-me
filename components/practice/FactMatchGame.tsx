"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, Briefcase, Heart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockUpcomingMeetings, MockContact } from "@/lib/data/mock-meetings";
import { GameShell, GameOverScreen } from "./GameShell";
import { useGameStats } from "@/hooks/useGameStats";

interface FactMatchGameProps {
  onBack: () => void;
}

type FactType = "role" | "company" | "interest";

interface GameQuestion {
  target: MockContact;
  factType: FactType;
  factValue: string;
  options: MockContact[];
}

// Helpers
function getContacts() {
    const uniqueContactsMap = new Map<string, MockContact>();
    mockUpcomingMeetings.forEach((m) => {
      if (m.contact) uniqueContactsMap.set(m.contact.id, m.contact);
    });
    return Array.from(uniqueContactsMap.values());
}

function generateQuestion(availableContacts: MockContact[]): GameQuestion | null {
    if (availableContacts.length < 4) return null;

    const target = availableContacts[Math.floor(Math.random() * availableContacts.length)];
    
    // Determine valid facts
    const validFacts: {type: FactType, value: string}[] = [];
    
    if (target.role) validFacts.push({ type: 'role', value: target.role });
    if (target.company) validFacts.push({ type: 'company', value: target.company });
    if (target.interests && target.interests.length > 0) {
        const interest = target.interests[Math.floor(Math.random() * target.interests.length)];
        validFacts.push({ type: 'interest', value: interest });
    }

    if (validFacts.length === 0) return null;

    const selectedFact = validFacts[Math.floor(Math.random() * validFacts.length)];

    const distractors = availableContacts
      .filter((c) => c.id !== target.id)
      .sort(() => 0.5 - Math.random()) 
      .slice(0, 3);

    return {
        target,
        factType: selectedFact.type,
        factValue: selectedFact.value,
        options: [target, ...distractors].sort(() => 0.5 - Math.random())
    };
}


export function FactMatchGame({ onBack }: FactMatchGameProps) {
  const { stats, recordGame } = useGameStats();
  const GAME_DURATION = 60;

  const [contacts] = useState<MockContact[]>(() => getContacts());
  
  // Game Lifecycle State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Round State
  const [gameState, setGameState] = useState<{
      question: GameQuestion | null;
      selectedOption: string | null;
      isCorrect: boolean | null;
  }>(() => {
      const allContacts = getContacts();
      return {
          question: generateQuestion(allContacts),
          selectedOption: null,
          isCorrect: null
      };
  });

  const startNextRound = () => {
    const nextQuestion = generateQuestion(contacts);
    if (nextQuestion) {
        setGameState({
            question: nextQuestion,
            selectedOption: null,
            isCorrect: null
        });
    }
  };

  const handleOptionClick = (contactId: string) => {
    if (gameState.selectedOption || !gameState.question || !isPlaying) return;

    const isCorrect = contactId === gameState.question.target.id;

    if (isCorrect) {
      setScore(s => s + 100);
    }
    
    setGameState(prev => ({
        ...prev,
        selectedOption: contactId,
        isCorrect
    }));
  };

  const handleTimeUp = () => {
      setIsPlaying(false);
      setIsGameOver(true);
      recordGame('factMatch', score);
  };
  
  const handlePlayAgain = () => {
      setScore(0);
      setIsPlaying(true);
      setIsGameOver(false);
      setGameState({
          question: generateQuestion(contacts),
          selectedOption: null,
          isCorrect: null
      });
  };
  
  if (contacts.length < 4) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">Not enough contacts to play.</p>
            <Button onClick={onBack}>Go Back</Button>
        </div>
      );
  }

  if (isGameOver) {
      return (
          <GameOverScreen 
            score={score} 
            bestScore={stats.bestScores.factMatch || 0}
            streak={stats.currentStreak}
            xpEarned={score}
            onPlayAgain={handlePlayAgain}
            onExit={onBack}
          />
      );
  }

  if (!gameState.question) return <div className="p-8 text-center">Loading...</div>;

  const renderIcon = () => {
    if (!gameState.question) return null;
      switch(gameState.question.factType) {
          case 'role': return <Briefcase size={48} className="text-blue-500" />;
          case 'company': return <Building2 size={48} className="text-orange-500" />;
          case 'interest': return <Heart size={48} className="text-pink-500" />;
      }
  };

  const renderPrompt = () => {
      if (!gameState.question) return "";
      switch(gameState.question.factType) {
          case 'role': return `Who is a ${gameState.question.factValue}?`;
          case 'company': return `Who works at ${gameState.question.factValue}?`;
          case 'interest': return `Who is interested in ${gameState.question.factValue}?`;
      }
  }

  return (
    <GameShell
        title="Fact Match"
        durationSeconds={GAME_DURATION}
        currentScore={score}
        onTimeUp={handleTimeUp}
        onExit={onBack}
        isActive={isPlaying}
    >
      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Question Header */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
             
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 transform -rotate-12"><Briefcase size={100} /></div>
                <div className="absolute bottom-10 right-10 transform rotate-12"><Heart size={100} /></div>
             </div>

             <div className="bg-white p-6 rounded-full shadow-lg mb-6 relative z-10">
                 {renderIcon()}
             </div>
             <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight relative z-10 max-w-lg">
                {renderPrompt()}
             </h2>
        </div>

        {/* Options */}
        <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-3">
                {gameState.question.options.map((option) => {
                    const isSelected = gameState.selectedOption === option.id;
                    const isTarget = gameState.question?.target.id === option.id;
                    
                    let buttonStyle = "bg-white border-2 border-gray-100 hover:border-pink-300 hover:bg-pink-50";
                    let icon: React.ReactNode = null;

                    if (gameState.selectedOption) {
                        if (isTarget) {
                            buttonStyle = "bg-green-100 border-2 border-green-500 text-green-800";
                            icon = <CheckCircle size={20} className="text-green-600" />;
                        } else if (isSelected && !isTarget) {
                            buttonStyle = "bg-red-50 border-2 border-red-200 text-red-800";
                            icon = <XCircle size={20} className="text-red-500" />;
                        } else {
                            buttonStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.id)}
                            disabled={!!gameState.selectedOption}
                            className={`flex items-center justify-between p-4 rounded-xl text-lg font-medium transition-all duration-200 ${buttonStyle} shadow-sm`}
                        >
                            <span className="flex items-center gap-3">
                                {option.photo ? (
                                    <img src={option.photo} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                        {option.initials}
                                    </div>
                                )}
                                <span className="truncate">{option.name}</span>
                            </span>
                            {icon}
                        </button>
                    );
                })}
            </div>
        </div>
        
        {/* Footer / Next Button */}
        {gameState.selectedOption && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center animate-in slide-in-from-bottom-4 fade-in">
                <Button 
                    onClick={startNextRound} 
                    size="lg" 
                    className="w-full sm:w-auto min-w-[200px] text-lg font-bold bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200"
                >
                    Next Question
                </Button>
            </div>
        )}

      </div>
    </GameShell>
  );
}
