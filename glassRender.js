const glassDropMount = document.querySelector('.glassDropMount')




const glassDropContainer = new Container({
    borderRadius: 10,
  type: 'rounded',
})
glassDropContainer.element.style.height = '100%'
glassDropContainer.element.style.boxShadow = '2px 3px 4px rgba(0, 0, 0, 0.25)'




// Set WebGL parameters for clearer glass effect
window.glassControls = {
  // Refraction Effects
  edgeIntensity: 0.00,     // Increase edge refraction (0-0.1) - Set to 0 to remove white rim
  rimIntensity: 0.00,      // Increase rim lighting (0-0.2) - Set to 0 to remove white rim
  baseIntensity: 0.017,     // Center distortion (0-0.05) - Set to 0 to remove white rim
  
  // Distance Falloffs
  edgeDistance: 0.0,      // Edge effect falloff (0.05-0.5)
  rimDistance: 2.0,        // Rim effect falloff (0.1-2.0) - Set to 0 to remove white rim
  baseDistance: 0.05,      // Base effect falloff (0.05-0.3) - Set to 0 to remove white rim
  
  // Visual Enhancements
  cornerBoost: 0.01,       // Corner enhancement (0-0.1) - Set to 0 to remove white rim
  rippleEffect: 0.0,      // Surface texture (0-0.5)
  blurRadius: 1.0,         // Background blur (1-15)
  tintOpacity: 0.0        // Gradient overlay (0-1.0)
}

glassDropMount.appendChild(glassDropContainer.element)


// Continuous rendering to fix animation lag
let animationFrameId

function startContinuousRender() {
  function render() {
    if (glassDropContainer.render) {
      glassDropContainer.render()
    }
    animationFrameId = requestAnimationFrame(render)
  }
  render()
}

function stopContinuousRender() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
}

// Start continuous rendering
startContinuousRender()
let initHandler = false
let debounceDelay = 10

// Handle scroll events - recapture page snapshot when scroll position changes
let scrollTimeout
window.addEventListener('scroll', () => {
    if (initHandler) {
        debounceDelay = 10000;
    }
  // Debounce scroll events to avoid excessive recapturing
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    console.log('Scroll detected, recapturing page snapshot...')
    
    // Reset snapshot state
    Container.pageSnapshot = null
    Container.isCapturing = true
    Container.waitingForSnapshot = Container.instances.slice()
    
    // Recapture page snapshot at current scroll position
    html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: function (element) {
        // Ignore all glass elements
        return (
          element.classList.contains('glass-container') ||
          element.classList.contains('glass-button') ||
          element.classList.contains('glass-button-text')
        )
      }
    })
      .then(snapshot => {
        console.log('Page snapshot recaptured after scroll')
        Container.pageSnapshot = snapshot
        Container.isCapturing = false
        
        // Create new image and update all glass instances
        const img = new Image()
        img.src = snapshot.toDataURL()
        img.onload = () => {
          Container.instances.forEach(instance => {
            if (instance.gl_refs && instance.gl_refs.gl) {
              const gl = instance.gl_refs.gl
              gl.bindTexture(gl.TEXTURE_2D, instance.gl_refs.texture)
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
              
              // Update texture size uniform
              gl.uniform2f(instance.gl_refs.textureSizeLoc, img.width, img.height)
              
              // Force re-render
              if (instance.render) {
                instance.render()
                console.log('Rendered glass instance')
              }
            }
          })
        }
        
        // Clear waiting queue
        Container.waitingForSnapshot = []
      })
      .catch(error => {
        console.error('html2canvas error on scroll:', error)
        Container.isCapturing = false
        Container.waitingForSnapshot = []
      })
      initHandler = true; 

      if (!initHandler) {
        initHandler = true;
      }

  }, debounceDelay) // 100ms debounce delay for scroll
})


document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopContinuousRender()
  } else {
    startContinuousRender()
  }
})




// Handle window resize - recapture page snapshot and update all glass instances
// TEMPORARILY DISABLED - This was causing glass effect to disappear when dev tools opened
/*
let resizeTimeout
window.addEventListener('resize', () => {
  // Debounce resize events to avoid excessive recapturing
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    console.log('Window resized, recapturing page snapshot...')

    // Reset snapshot state
    Container.pageSnapshot = null
    Container.isCapturing = true
    Container.waitingForSnapshot = Container.instances.slice() // All instances need update

    // Recapture page snapshot
    html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ignoreElements: function (element) {
        // Ignore all glass elements
        return (
          element.classList.contains('glass-container') ||
          element.classList.contains('glass-button') ||
          element.classList.contains('glass-button-text')
        )
      }
    })
      .then(snapshot => {
        console.log('Page snapshot recaptured after resize')
        Container.pageSnapshot = snapshot
        Container.isCapturing = false

        // Create new image and update all glass instances
        const img = new Image()
        img.src = snapshot.toDataURL()
        img.onload = () => {
          Container.instances.forEach(instance => {
            if (instance.gl_refs && instance.gl_refs.gl) {
              // Check if this is a nested glass button
              if (instance instanceof Button && instance.parent && instance.isNestedGlass) {
                // For nested glass buttons, reinitialize their texture to match parent's new size
                const gl = instance.gl_refs.gl
                const containerCanvas = instance.parent.canvas

                // Resize the button's texture to match new container canvas size
                gl.bindTexture(gl.TEXTURE_2D, instance.gl_refs.texture)
                gl.texImage2D(
                  gl.TEXTURE_2D,
                  0,
                  gl.RGBA,
                  containerCanvas.width,
                  containerCanvas.height,
                  0,
                  gl.RGBA,
                  gl.UNSIGNED_BYTE,
                  null
                )

                // Update texture size uniform to new container dimensions
                gl.uniform2f(instance.gl_refs.textureSizeLoc, containerCanvas.width, containerCanvas.height)

                // Update container size uniform for sampling calculations
                if (instance.gl_refs.containerSizeLoc) {
                  gl.uniform2f(instance.gl_refs.containerSizeLoc, instance.parent.width, instance.parent.height)
                }

                console.log(`Updated nested button texture: ${containerCanvas.width}x${containerCanvas.height}`)
              } else {
                // For standalone glass elements, update with new page snapshot
                const gl = instance.gl_refs.gl
                gl.bindTexture(gl.TEXTURE_2D, instance.gl_refs.texture)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

                // Update texture size uniform
                gl.uniform2f(instance.gl_refs.textureSizeLoc, img.width, img.height)
              }

              // Force re-render for all instances
              if (instance.render) {
                instance.render()
              }
            }
          })
        }

        // Clear waiting queue
        Container.waitingForSnapshot = []
      })
      .catch(error => {
        console.error('html2canvas error on resize:', error)
        Container.isCapturing = false
        Container.waitingForSnapshot = []
      })
  }, 300) // 300ms debounce delay
})
*/
