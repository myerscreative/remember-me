"use client";

import React, { useState, useEffect } from "react";
import { User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockUpcomingMeetings, MockContact } from "@/lib/data/mock-meetings";
import { GameShell, GameOverScreen } from "./GameShell";
import { useGameStats } from "@/hooks/useGameStats";

interface FaceMatchGameProps {
  onBack: () => void;
}

// Helper to init contacts
function getContactsWithPhotos() {
    const uniqueContactsMap = new Map<string, MockContact>();
    mockUpcomingMeetings.forEach((m) => {
        if (m.contact && m.contact.photo) {
            uniqueContactsMap.set(m.contact.id, m.contact);
        }
    });
    return Array.from(uniqueContactsMap.values());
}

export function FaceMatchGame({ onBack }: FaceMatchGameProps) {
  const { stats, recordGame } = useGameStats();
  
  // Game Configuration
  const GAME_DURATION = 60; // 60 seconds
  
  // Static data init
  const [contacts] = useState<MockContact[]>(() => getContactsWithPhotos());

  // Game Lifecycle State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Round State
  const [roundState, setRoundState] = useState<{
      target: MockContact | null;
      options: MockContact[];
      selectedOption: string | null;
      isCorrect: boolean | null;
  }>(() => createNewRound(getContactsWithPhotos()));

  function createNewRound(availableContacts: MockContact[]) {
      if (availableContacts.length < 4) {
          return { target: null, options: [], selectedOption: null, isCorrect: null };
      }
      
      const target = availableContacts[Math.floor(Math.random() * availableContacts.length)];
      const distractors = availableContacts
        .filter((c) => c.id !== target.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const options = [target, ...distractors].sort(() => 0.5 - Math.random());

      return {
          target,
          options,
          selectedOption: null,
          isCorrect: null
      };
  }

  const startNextRound = () => {
       if (contacts.length < 4) return;
       setRoundState(createNewRound(contacts));
  };

  const handleOptionClick = (contactId: string) => {
    if (roundState.selectedOption || !isPlaying) return; 

    const isCorrect = roundState.target?.id === contactId;
    
    // Scoring Logic
    if (isCorrect) {
      setScore(s => s + 100); // 100 pts per correct answer
    }
    
    setRoundState(prev => ({
        ...prev,
        selectedOption: contactId,
        isCorrect
    }));
    
    // Auto-advance after short delay if correct? Or manual?
    // User spec implies speed. Let's auto-advance after 500ms if correct, 
    // or wait for click if wrong to learn? 
    // Let's stick to manual "Next" for MVP to avoid confusion, 
    // OR manual "Next" allows reviewing the face.
  };

  const handleTimeUp = () => {
      setIsPlaying(false);
      setIsGameOver(true);
      recordGame('faceMatch', score);
  };
  
  const handlePlayAgain = () => {
      setScore(0);
      setIsPlaying(true);
      setIsGameOver(false);
      setRoundState(createNewRound(contacts));
  };

  if (contacts.length < 4) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">Not enough contacts with photos to play.</p>
            <Button onClick={onBack}>Go Back</Button>
        </div>
    );
  }

  if (isGameOver) {
      return (
          <GameOverScreen 
            score={score} 
            bestScore={stats.bestScores.faceMatch}
            streak={stats.currentStreak}
            xpEarned={score}
            onPlayAgain={handlePlayAgain}
            onExit={onBack}
          />
      );
  }

  if (!roundState.target) return <div className="p-8 text-center">Loading...</div>;

  return (
    <GameShell
        title="Face Match"
        durationSeconds={GAME_DURATION}
        currentScore={score}
        onTimeUp={handleTimeUp}
        onExit={onBack}
        isActive={isPlaying}
    >
      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Photo Section */}
        <div className="h-64 bg-gray-100 relative flex items-center justify-center overflow-hidden">
             {roundState.target.photo ? (
                 <img 
                    src={roundState.target.photo} 
                    alt="Who is this?" 
                    className="w-full h-full object-cover"
                 />
             ) : (
                 <User size={64} className="text-gray-300" />
             )}
             
             {/* Feedback Overlay */}
             {roundState.isCorrect !== null && (
                 <div className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in`}>
                     <div className={`transform scale-110 p-4 rounded-full bg-white shadow-2xl`}>
                        {roundState.isCorrect ? (
                            <CheckCircle size={64} className="text-green-500" />
                        ) : (
                            <XCircle size={64} className="text-red-500" />
                        )}
                     </div>
                 </div>
             )}
        </div>

        {/* Question */}
        <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Who is this?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roundState.options.map((option) => {
                    const isSelected = roundState.selectedOption === option.id;
                    const isTarget = roundState.target?.id === option.id;
                    
                    let buttonStyle = "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
                    
                    if (roundState.selectedOption) {
                        if (isTarget) {
                            buttonStyle = "bg-green-100 border-2 border-green-500 text-green-800";
                        } else if (isSelected && !isTarget) {
                            buttonStyle = "bg-red-50 border-2 border-red-200 text-red-800";
                        } else {
                            buttonStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionClick(option.id)}
                            disabled={!!roundState.selectedOption}
                            className={`p-4 rounded-xl text-lg font-medium transition-all duration-200 ${buttonStyle}`}
                        >
                            {option.name}
                        </button>
                    );
                })}
            </div>
        </div>
        
        {/* Footer / Next Button */}
        {roundState.selectedOption && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center animate-in slide-in-from-bottom-4 fade-in">
                <Button 
                    onClick={startNextRound} 
                    size="lg" 
                    className="w-full sm:w-auto min-w-[200px] text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                    Next Person
                </Button>
            </div>
        )}

      </div>
    </GameShell>
  );
}
