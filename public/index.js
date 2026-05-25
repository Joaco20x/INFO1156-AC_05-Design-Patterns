import {
    addLike,
    createComment,
    createPost,
    listComments,
    listFeed,
    listPosts,
} from "./posts-api.js"

const modalElement = document.querySelector("#post-modal")
const postFormElement = document.querySelector("#post-form")
const feedElement = document.querySelector("#feed")
const openModalButton = document.querySelector("[data-open-modal]")
const closeModalButton = document.querySelector("[data-close-modal]")
const refreshFeedButton = document.querySelector("#refresh-feed")
const feedModeElement = document.querySelector("#feed-mode")

const state = {
    posts: [],
    commentsByPost: {},
    mode: "latest",
}

const clearElement = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

const isValidHttpUrl = (candidate) => {
    try {
        const parsedUrl = new URL(candidate)
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
    } catch {
        return false
    }
}

const renderError = (message) => {
    if (!feedElement) {
        return
    }

    clearElement(feedElement)
    const errorNode = document.createElement("p")
    errorNode.className =
        "col-span-full rounded border border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700"
    errorNode.textContent = message
    feedElement.appendChild(errorNode)
}

const renderComments = (postId, container) => {
    const comments = state.commentsByPost[postId] || []

    clearElement(container)

    if (comments.length === 0) {
        const empty = document.createElement("p")
        empty.className = "text-xs text-zinc-500"
        empty.textContent = "No comments yet"
        container.appendChild(empty)
        return
    }

    comments.slice(0, 5).forEach((comment) => {
        const item = document.createElement("p")
        item.className = "rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
        item.textContent = comment.content
        container.appendChild(item)
    })
}

const renderFeed = () => {
    if (!feedElement) {
        return
    }

    clearElement(feedElement)

    if (state.posts.length === 0) {
        const emptyNode = document.createElement("p")
        emptyNode.className =
            "col-span-full rounded border border-zinc-300 bg-white px-6 py-4 text-sm text-zinc-600"
        emptyNode.textContent = "No hay posts todavia."
        feedElement.appendChild(emptyNode)
        return
    }

    state.posts.forEach((post) => {
        const card = document.createElement("article")
        card.className =
            "w-full max-w-[380px] rounded border border-zinc-300 bg-white shadow-sm"

        const image = document.createElement("img")
        image.className = "h-72 w-full object-cover bg-zinc-200"
        image.src = post.imageUrl
        image.alt = post.title
        image.loading = "lazy"

        const body = document.createElement("div")
        body.className = "space-y-3 p-4"

        const title = document.createElement("h3")
        title.className = "text-lg font-semibold text-zinc-900"
        title.textContent = post.title

        const description = document.createElement("p")
        description.className = "text-sm leading-6 text-zinc-700"
        description.textContent = post.description

        const stats = document.createElement("div")
        stats.className = "grid grid-cols-3 gap-2 text-center text-xs"

        const likesButton = document.createElement("button")
        likesButton.type = "button"
        likesButton.className =
            "inline-flex items-center justify-center gap-1 rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-white"
        likesButton.innerHTML = `<i class="bi bi-heart-fill"></i><span>${post.likesCount || 0}</span>`

        likesButton.addEventListener("click", async () => {
            try {
                await addLike(post.id, {
                    reactionType: "like",
                    weight: 1,
                })
                await refreshFeed()
            } catch (error) {
                renderError(
                    error instanceof Error ? error.message : "Like failed",
                )
            }
        })

        const commentsCount = document.createElement("span")
        commentsCount.className =
            "rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600"
        commentsCount.textContent = `Comments ${post.commentsCount || 0}`

        const relevanceScore = document.createElement("span")
        relevanceScore.className =
            "rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600"
        relevanceScore.textContent = `Relevance ${post.relevanceScore || 0}`

        stats.appendChild(likesButton)
        stats.appendChild(commentsCount)
        stats.appendChild(relevanceScore)

        const commentsTitle = document.createElement("p")
        commentsTitle.className =
            "inline-flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500"
        commentsTitle.innerHTML =
            '<i class="bi bi-chat-left-text"></i><span>Comments</span>'

        const commentsContainer = document.createElement("div")
        commentsContainer.className =
            "max-h-32 space-y-1 overflow-y-auto rounded border border-zinc-200 bg-zinc-50 p-2 pr-1"
        renderComments(post.id, commentsContainer)

        const commentForm = document.createElement("form")
        commentForm.className = "flex gap-2"

        const commentInput = document.createElement("input")
        commentInput.className =
            "w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none"
        commentInput.placeholder = "Write a comment"

        const commentButton = document.createElement("button")
        commentButton.className =
            "inline-flex items-center gap-1 rounded border border-zinc-900 bg-zinc-900 px-3 py-1 text-xs text-white"
        commentButton.type = "submit"
        commentButton.innerHTML = '<i class="bi bi-send"></i><span>Send</span>'

        commentForm.appendChild(commentInput)
        commentForm.appendChild(commentButton)

        commentForm.addEventListener("submit", async (event) => {
            event.preventDefault()
            const content = commentInput.value.trim()
            if (!content) {
                return
            }

            if (content.length < 2) {
                renderError("Comment too short")
                return
            }

            try {
                await createComment(post.id, { content })
                commentInput.value = ""
                await refreshFeed()
            } catch (error) {
                renderError(
                    error instanceof Error
                        ? error.message
                        : "Create comment failed",
                )
            }
        })

        body.appendChild(title)
        body.appendChild(description)
        body.appendChild(stats)
        body.appendChild(commentsTitle)
        body.appendChild(commentsContainer)
        body.appendChild(commentForm)

        card.appendChild(image)
        card.appendChild(body)

        feedElement.appendChild(card)
    })
}

const openModal = () => {
    if (modalElement) {
        modalElement.showModal()
    }
}

const closeModal = () => {
    if (modalElement) {
        modalElement.close()
    }

    if (postFormElement) {
        postFormElement.reset()
    }
}

const loadCommentsForPost = async (postId) => {
    const response = await listComments(postId)
    if (response && Array.isArray(response.comments)) {
        state.commentsByPost[postId] = response.comments
    }
}

const handleCreatePost = async () => {
    if (!postFormElement) {
        return
    }

    const formData = new FormData(postFormElement)
    const payload = {
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        imageUrl: String(formData.get("imageUrl") || "").trim(),
    }

    if (!payload.title || !payload.description || !payload.imageUrl) {
        throw new Error("Completa todos los campos")
    }

    if (!isValidHttpUrl(payload.imageUrl)) {
        throw new Error("La URL de imagen debe ser valida")
    }

    await createPost(payload)
}

const refreshFeed = async () => {
    try {
        const listResponse = await listPosts()
        const listItems = Array.isArray(listResponse)
            ? listResponse
            : listResponse?.items

        if (!Array.isArray(listItems)) {
            throw new Error("Broken /api/posts response")
        }

        const feedResponse = await listFeed(state.mode)
        const feedRows = Array.isArray(feedResponse)
            ? feedResponse
            : feedResponse?.rows

        if (!Array.isArray(feedRows)) {
            throw new Error("Broken /api/posts/feed response")
        }

        state.posts = feedRows

        for (const post of state.posts) {
            await loadCommentsForPost(post.id)
        }

        renderFeed()
    } catch (error) {
        renderError(
            error instanceof Error ? error.message : "No se pudo cargar",
        )
    }
}

const bindEvents = () => {
    openModalButton?.addEventListener("click", openModal)
    closeModalButton?.addEventListener("click", closeModal)
    refreshFeedButton?.addEventListener("click", refreshFeed)

    feedModeElement?.addEventListener("change", () => {
        state.mode = feedModeElement.value
        refreshFeed()
    })

    postFormElement?.addEventListener("submit", async (event) => {
        event.preventDefault()

        try {
            await handleCreatePost()
            closeModal()
            await refreshFeed()
        } catch (error) {
            renderError(
                error instanceof Error
                    ? error.message
                    : "No se pudo crear el post",
            )
        }
    })
}

bindEvents()
refreshFeed()
