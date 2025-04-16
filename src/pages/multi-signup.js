import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import "../styles/signup.css"
import events from '../../dist/events.json'

export default function App({ location }) {
    const [matchingEvents, setMatchingEvents] = useState([])
    const [submissionStatus, setSubmissionStatus] = useState({})
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const searchTerm = params.get("search")
        if (searchTerm) {
            const now = new Date()

            // First filter by search term and future dates
            const filteredEvents = events.filter(event => {
                const eventStart = new Date(event.start)
                return event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    eventStart > now
            })

            // Then filter out duplicate events by title
            const seenTitles = new Set()
            const uniqueEvents = filteredEvents.filter(event => {
                if (seenTitles.has(event.title)) {
                    return false
                }
                seenTitles.add(event.title)
                return true
            })

            setMatchingEvents(uniqueEvents)
            // Initialize submission status for each event
            const initialStatus = {}
            uniqueEvents.forEach(event => {
                initialStatus[event.uid] = 'pending'
            })
            setSubmissionStatus(initialStatus)
        }
    }, [location.search])

    const onSubmit = async data => {
        const eventIds = Array.isArray(data.eventIds) ? data.eventIds : [data.eventIds]

        for (const eventId of eventIds) {
            setSubmissionStatus(prev => ({ ...prev, [eventId]: 'submitting' }))

            try {
                const body = JSON.stringify({
                    ...data,
                    eventId
                })

                const response = await fetch(`/api/signup-submit`, {
                    method: `POST`,
                    body,
                    headers: {
                        "content-type": `application/json`,
                    },
                    signal: AbortSignal.timeout(120000)
                })

                const result = await response.json()
                setSubmissionStatus(prev => ({ ...prev, [eventId]: 'success' }))
            } catch (err) {
                console.error(`Error updating calendar for event ${eventId}:`, err)
                setSubmissionStatus(prev => ({ ...prev, [eventId]: `Error: ${err.message}` }))
            }
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'submitting':
                return <span className="spinner">⏳</span>
            case 'success':
                return <span className="success">✓</span>
            case 'pending':
                return null
            default:
                return <span className="error">⚠️</span>
        }
    }

    return (
        <div className="signup form-container">
            <h2>Sign Up For Events</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" {...register("email", { required: true })} />
                    {errors.email && <span className="error">This field is required</span>}
                </div>

                <div className="form-group">
                    <label>Select Events</label>
                    <div className="event-checkboxes">
                        {matchingEvents.map(event => (
                            <div key={event.uid} className="event-checkbox">
                                <input
                                    type="checkbox"
                                    id={`event-${event.uid}`}
                                    value={event.uid}
                                    {...register("eventIds")}
                                    disabled={submissionStatus[event.uid] === 'submitting' || submissionStatus[event.uid] === 'success'}
                                />
                                <label htmlFor={`event-${event.uid}`}>
                                    {event.title}
                                </label>
                                {getStatusIcon(submissionStatus[event.uid])}
                                {submissionStatus[event.uid]?.startsWith('Error') && (
                                    <span className="error-message">{submissionStatus[event.uid]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    {errors.eventIds && <span className="error">Please select at least one event</span>}
                </div>

                <button type="submit">Sign Up</button>
            </form>
        </div>
    )
}