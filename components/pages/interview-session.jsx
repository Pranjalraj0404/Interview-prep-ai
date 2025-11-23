"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Pin, PinOff, Plus, BookOpen, Lightbulb, ChevronDown, ChevronRight, Sparkles, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AddQuestionsDialog } from "@/components/dialogs/add-questions-dialog"
import { ExplanationDialog } from "@/components/dialogs/explanation-dialog"

export function InterviewSession({ sessionId }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openQuestions, setOpenQuestions] = useState(new Set())
  const [addQuestionsOpen, setAddQuestionsOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Session fetched:", {
          sessionId: data.session?._id,
          questionsCount: data.session?.questions?.length || 0
        })
        setSession(data.session)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Session fetch error:", errorData)
        toast({
          title: "Error",
          description: errorData.message || "Session not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching session:", error)
      toast({
        title: "Error",
        description: "Failed to fetch session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray(data) ? data : []
        const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setHistory(sorted.slice(0, 8))
      }
    } catch (e) {
      console.error("History fetch error", e)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [sessionId])

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    } catch {
      return d
    }
  }

  const toggleQuestion = (questionId) => {
    const newOpenQuestions = new Set(openQuestions)
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId)
    } else {
      newOpenQuestions.add(questionId)
    }
    setOpenQuestions(newOpenQuestions)
  }

  const togglePin = async (questionId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/questions/${questionId}/pin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map((q) => (
              q._id === questionId ? { ...q, isPinned: !!data.question.is_pinned } : q,
            )),
          }
        })
        toast({
          title: "Success",
          description: data.question.isPinned ? "Question pinned" : "Question unpinned",
        })
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      })
    }
  }

  const updateNote = async (questionId, note) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/questions/${questionId}/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map((q) => (q._id === questionId ? { ...q, note: data.question.note } : q)),
          }
        })
        toast({
          title: "Success",
          description: "Note updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      })
    }
  }

  // Function to format answer text and remove ** formatting
  const formatAnswerText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove ** formatting
      .replace(/\*([^*]+)\*/g, "$1") // Remove single * formatting
      .trim()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-500/20 rounded-full blur-xl animate-float-gentle"></div>
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-2xl animate-float-reverse"></div>
        </div>
        <div className="py-8">
          <div className="w-full px-4">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-white/30 rounded-2xl w-1/3"></div>
              <div className="h-32 bg-white/30 rounded-3xl"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/30 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h1>
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const pinnedQuestions = session.questions.filter((q) => q.isPinned)
  const unpinnedQuestions = session.questions.filter((q) => !q.isPinned)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-500/20 rounded-full blur-xl animate-float-gentle"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-lg animate-float-reverse"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-2xl animate-float-gentle"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float-reverse"></div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.1)_1px,transparent_0)] bg-[length:40px_40px] opacity-30"></div>

      <div className="relative z-10 py-8">
        <div className="w-full">
          {/* Header */}
          <div className="px-6 mb-8">
            <Button variant="ghost" asChild className="mb-6 ml-6 hover:bg-white/20 transition-all duration-300">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>

            <Card className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
              <CardHeader className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                        {session.role}
                      </CardTitle>
                      <CardDescription className="text-lg mt-2 text-gray-600 font-medium">
                        {session.experience} experience • {session.questions.length} questions
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setAddQuestionsOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Questions
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-3 flex items-center text-lg">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Focus Topics
                    </h3>
                    <p className="text-gray-700 font-medium">{session.topicsToFocus}</p>
                  </div>
                  {session.description && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100">
                      <h3 className="font-bold text-blue-900 mb-3 text-lg">Description</h3>
                      <p className="text-gray-700 font-medium">{session.description}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Previous Sessions</h3>
                    {historyLoading ? (
                      <div className="text-gray-500">Loading…</div>
                    ) : history.length === 0 ? (
                      <div className="text-gray-600">No sessions yet</div>
                    ) : (
                      <div className="space-y-2">
                        {history.map((s) => (
                          <Link key={s._id} href={`/session/${s._id}`} className="block">
                            <div className="flex items-center justify-between bg-white/70 hover:bg-white rounded-xl border border-gray-200 px-3 py-2 transition">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                <div className="text-sm font-semibold text-gray-900 line-clamp-1">{s.role}</div>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(s.createdAt)}</span>
                                {s._id === sessionId && (
                                  <span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">Current</span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pinned Questions */}
          {pinnedQuestions.length > 0 && (
            <div className="px-6 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Pin className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Pinned Questions ({pinnedQuestions.length})</h2>
              </div>
              <div className="space-y-4">
                {pinnedQuestions.map((question, index) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    isOpen={openQuestions.has(question._id)}
                    onToggle={() => toggleQuestion(question._id)}
                    onTogglePin={() => togglePin(question._id)}
                    onUpdateNote={(note) => updateNote(question._id, note)}
                    formatAnswerText={formatAnswerText}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Questions */}
          <div className="px-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">All Questions ({unpinnedQuestions.length})</h2>
            </div>
            <div className="space-y-4">
              {unpinnedQuestions.map((question, index) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  isOpen={openQuestions.has(question._id)}
                  onToggle={() => toggleQuestion(question._id)}
                  onTogglePin={() => togglePin(question._id)}
                  onUpdateNote={(note) => updateNote(question._id, note)}
                  formatAnswerText={formatAnswerText}
                  index={index}
                />
              ))}
            </div>
          </div>

          <AddQuestionsDialog
            open={addQuestionsOpen}
            onOpenChange={setAddQuestionsOpen}
            sessionId={sessionId}
            onQuestionsAdded={fetchSession}
          />
        </div>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  isOpen,
  onToggle,
  onTogglePin,
  onUpdateNote,
  formatAnswerText,
  index,
}) {
  const [note, setNote] = useState(question.note)
  const [noteChanged, setNoteChanged] = useState(false)

  const handleNoteChange = (value) => {
    setNote(value)
    setNoteChanged(value !== question.note)
  }

  const saveNote = () => {
    onUpdateNote(note)
    setNoteChanged(false)
  }

  return (
    <Card
      className="group overflow-hidden bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
      style={{
        animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-indigo-600 transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-300" />
                  )}
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 text-left group-hover:text-indigo-700 transition-colors duration-300">
                  {question.question}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Inline Action Buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePin()
                  }}
                  className={`transition-all duration-300 hover:scale-110 ${
                    question.isPinned
                      ? "text-yellow-600 hover:bg-yellow-50 bg-yellow-50/50"
                      : "text-gray-500 hover:bg-gray-50 hover:text-yellow-600"
                  }`}
                >
                  {question.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>

                <ExplanationDialog question={question.question}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 hover:scale-110"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </ExplanationDialog>

                {question.isPinned && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-0 px-2 py-1"
                  >
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 relative z-10">
            <div className="space-y-6">
              {/* Professional Answer Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Answer
                </h4>
                <div className="prose prose-blue max-w-none">
                  <div className="text-blue-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {formatAnswerText(question.answer)}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Personal Notes</h4>
                <Textarea
                  placeholder="Add your personal notes, insights, or key points to remember..."
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  className="min-h-[100px] border-2 border-gray-200 focus:border-indigo-400 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300"
                />
                {noteChanged && (
                  <Button
                    size="sm"
                    onClick={saveNote}
                    className="mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    Save Note
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
