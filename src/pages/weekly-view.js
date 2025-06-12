import React, { useState, useEffect } from "react"
import events from '../../dist/events.json'

function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date, timezone) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
        hour12: true
    })
}

function getEventsForDate(date, allEvents) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return allEvents.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate >= startOfDay && eventDate <= endOfDay
    }).sort((a, b) => new Date(a.start) - new Date(b.start))
}

export default function App({ location }) {
    const [weekEvents, setWeekEvents] = useState([])
    const [startDate, setStartDate] = useState(new Date())

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const dateParam = params.get("date")
        if (dateParam) {
            setStartDate(new Date(dateParam))
        }
    }, [location.search])

    useEffect(() => {
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            return date
        })

        const weekEvents = dates.map(date => ({
            date,
            events: getEventsForDate(date, events)
        })).filter(day => day.events.length > 0) // Only include days with events

        setWeekEvents(weekEvents)
    }, [startDate])

    return (
        <div>
            <h1>This Week At FINOS</h1>
            {weekEvents.map(({ date, events }) => (
                <div key={date.toISOString()}>
                    <h2>{formatDate(date)}</h2>
                    <ul>
                        {events.map(event => {
                            const eventDate = new Date(event.start)
                            return (
                                <li key={event.eventId}>
                                    <span style={{ color: '#666' }}>
                                        {formatTime(eventDate, 'America/New_York')} NYC / {formatTime(eventDate, 'Europe/London')} UK
                                    </span> - {event.title} - <a href={`/signup?title=${encodeURIComponent(event.title)}&eventId=${event.uid}`}>Sign Up</a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ))}
        </div>
    )
}