import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import "../styles/signup.css"
import events from '../../dist/events.json'

export default function App({ location }) {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [matchingEvents, setMatchingEvents] = useState([])
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
        }
    }, [location.search])

    const onSubmit = data => {
        setIsSubmitted('spinner')
        // Ensure eventIds is an array before joining
        const eventIds = Array.isArray(data.eventIds) ? data.eventIds : [data.eventIds]
        const body = JSON.stringify({
            ...data,
            eventId: eventIds.join(',')
        })
        console.log(`body:`, body)
        fetch(`/api/signup-submit`, {
            method: `POST`,
            body,
            headers: {
                "content-type": `application/json`,
            },
            signal: AbortSignal.timeout(120000)
        })
            .then(res => res.json())
            .then(body => {
                console.log(`response from API:`, body)
                setIsSubmitted(body)
            }).catch(err => {
                console.error(`Error updating calendar:`, err)
                setIsSubmitted(`Error updating calendar: ${err}`)
            })
    }

    if (isSubmitted === 'spinner') {
        return (
            <div className="signup form-container">
                <h2>Please wait</h2>
                <p>Updating the calendar and sending invites...</p>
            </div>
        )
    } else if (isSubmitted) {
        if (isSubmitted === 'success') {
            return (
                <div className="signup form-container">
                    <h2>Thank you for signing up!</h2>
                    <p>Please check your inbox for your calendar invites.</p>
                </div>
            )
        } else {
            return (
                <div className="signup result-container">
                    <h2>Thank you for signing up!</h2>
                    <h3>Your invites should arrive within the hour. If this doesn't happen, please relay this info to help@finos.org:</h3>
                    <pre>{isSubmitted}</pre>
                </div>
            )
        }
    } else {
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
                                    />
                                    <label htmlFor={`event-${event.uid}`}>
                                        {event.title}
                                    </label>
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
}