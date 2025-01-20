import React, { useState } from "react"
import { useForm } from "react-hook-form"
import "../styles/signup.css"

export default function App({ location }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const onSubmit = data => {
    fetch(`/api/signup-submit`, {
      method: `POST`,
      body: JSON.stringify(data),
      headers: {
        "content-type": `application/json`,
      },
    })
      .then(res => res.json())
      .then(body => {
        console.log(`response from API:`, body)
        setIsSubmitted(true)
      })
  }

  const params = new URLSearchParams(location.search)

  if (isSubmitted) {
    return (
     <div className="signup form-container">
        <h2>Thank you for signing up!</h2>
        <p>Please check your inbox for a calendar invite for <b>{params.get("title")}</b>.</p>
      </div>
    )
  } else {
    return (
      <div className="signup form-container">
        <h2>Sign Up For <b>{params.get("title")}</b></h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" {...register("email", { required: true })} />
            {errors.email && <span className="error">This field is required</span>}
          </div>
          <div className="form-group">
            <label htmlFor="eventId">Event ID</label>
            <input
              id="eventId"
              type="text"
              {...register("eventId", {
                required: false,
                minLength: 10,
                value: params.get("eventId"),
              })}
            />
          </div>
          <button type="submit">Sign Up</button>
        </form>
      </div>
    )
  }
}