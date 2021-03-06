/**
 * 
 * @param {*} content 容器
 * @param {*} img_arr 需要显示的图片数组
 */
function init_el_wrap(content,img_arr){
    let bound_obj = content.getBoundingClientRect() // 容器坐标对象
    let content_width = bound_obj.width             // 容器宽高
    let content_height = bound_obj.height
     
    let k = 1/5 // 10
    let w = 3
    let sub_content_count = 150                     // 子容器的数量
    let show_img_list = mixin_img_arr(img_arr,sub_content_count)
    let sub_content_space = content_width/5 * k                      // 子容器之间的间隔
    let sub_content_width = ( content_width - sub_content_space/k ) * k       // 子容器宽度
    let sub_content_height = ( content_height -sub_content_space/k ) * k     // 子容器高度
                                                    // 子容器的对角线半径
    let sub_content_radius = 4*Math.sqrt(Math.pow(sub_content_height/2,2) + Math.pow(sub_content_width/2,2))
    let content_center = {                          // 容器中心位置 ( 相对于三维偏移 )
        x : content_width / 2 - sub_content_width / 2,
        y : content_height / 2 - sub_content_height / 2
    }
    let sub_content_left =  - content_width     // 子容器横向排放的其实坐标做边界
    let sub_content_right = 2 * content_width
    let rect_animate_timer                      // 横向运动的timer
    let circle_sub_animate_timer                // 环绕运动的timer
    let involved_sub_list = []                  // 当前受到影响的子容器列表
    let content_perspective = 500
    content.style.position = "relative"
    content.style.perspective = content_perspective + "px"
    content.style.transformStyle = "preserve-3d"
    content.style.webkitTransformStyle = "preserve-3d"
    content.style.overflow = "hidden";

    let rect_anim_position = []                     // 横向动画时的子对象的坐标信息 ( 默认子元素的坐标信息 )

    fill_content()                  // 默认先填充子容器
    
    function fill_content(){        // 填充子容器
        let row_len = w/k           // 每一行能排放几个子容器
        let row = 0                 // 当前子容器排放到第几行
        let count = 0               // 当前行已经排放几个子容器
        let index = 0               // 记录当前子容器对象在容器列表中的位置
        
        for(let i = 0;i < sub_content_count;i++){
            //img_arr[i]
            var sub_item = init_sub_content(show_img_list[i])   // 创建一个子容器
            
            if( count == row_len ){ 
                count = 0
                row++
            }
            let sub_x = sub_content_left + count * sub_content_width + count*sub_content_space
            let sub_y = row * sub_content_height + row*sub_content_space
            sub_item.style.transform = `translate3d(
                ${ sub_x }px,
                ${ sub_y }px,
                0px)`
            count++
            sub_item._my_index = index  // 为子容器元素添加标记
            index++
            rect_anim_position.push({
                element:sub_item,
                x:sub_x,
                y:sub_y,
                z:0
            })
            content.appendChild(sub_item)
        }
        rect_animate()             // 填充完子容器后默认执行横向动画  
    }
    
    function rect_animate(){        // 子容器默认动画
        rect_anim_position.forEach(function(item){
            item.x -= 0.4
            if(item.x < sub_content_left){
                item.x = sub_content_right
            }
            item.element.style.transform = `translate3d(
                ${item.x}px,
                ${item.y}px,
                0px)`
        })
        rect_animate_timer = requestAnimationFrame(rect_animate)
    }

    function init_sub_content(img_url){    // 创建默认子容器对象元素
        let ele = document.createElement('div')
        ele.style.backgroundClip = "content-box"
        ele.style.backgroundImage = `url(${ img_url })`
        ele.style.backgroundSize = "100% 100%"
        ele.classList.add("sub_content")
        ele.style.display = "inline-block"
        ele.style.position = "absolute"         // 使得所有子容器的偏移中心一致
        ele.style.width = sub_content_width +"px"
        ele.style.height = sub_content_height+"px"
        ele.style.cursor = "pointer"
        ele.onclick = sub_content_click
        return ele
    }

    function sub_content_click(e){
        let selected_target_tramsform = e.target.transform  // 暂时保存选中的子容器的信息
        let rect_index = e.target._my_index                 // 当前子元素对象在容器列表中的位置
        let involved_sub_list                               // 受到影响的子容器对象列表
        e.target.style.zIndex = 1
        cancelAnimationFrame(rect_animate_timer)            //  停止横向动作

        e.target.onclick = function(){                      // 设置恢复的动作监听
            cancelAnimationFrame(circle_sub_animate_timer)  // 停止环形运动
            e.target.style.zIndex = 0
            e.target.style.transition = ""                  
            e.target.style.transform = selected_target_tramsform
            rect_anim_position.forEach(function(item){
                item.element.onclick = sub_content_click    // 重新设置事件监听
            })
            involved_sub_list.forEach(function(item){
                item.element.style.transform = `translate3d(
                    ${item.x}px,
                    ${item.y}px,
                    0px)`
            })
            e.target.style.transform = `translate3d(
                    ${rect_anim_position[rect_index].x}px,
                    ${rect_anim_position[rect_index].y}px,
                    0px)`
            e.target.style.transition = "0.5s"
            setTimeout(function(){// 重新开始横向动作
                involved_sub_list.forEach(function(item){
                    item.element.style.transition = "0s"
                })
                e.target.style.transition = "0s"
                rect_animate()                                  
            },550)
            return
        }
        involved_sub_list = involved_subs(content_center,rect_index)// 以当前选中点为中心 受到影响的子容器对象列表
        move_involved_subs(content_center,involved_sub_list)

        // content.style.overflow = "";

        // 选中项偏移至中央
        e.target.style.transition = "0.5s"
        e.target.style.transform = `translate3d(
            ${ content_center.x }px,
            ${ content_center.y }px,
            ${ content_height/3 }px)`
    }
   
    // 控制滑动商品列表
    document.onmousedown = content_event
    function content_event(down_event){
        var down_x = down_event.clientX
        document.onmousemove = function(move_event){
            var drop_x = move_event.clientX - down_x
            down_x = move_event.clientX
            rect_anim_position.forEach(function(item){
                item.x += drop_x
                if(item.x < sub_content_left){
                    item.x = sub_content_right
                }
                item.element.style.transform = `translate3d(
                    ${item.x}px,
                    ${item.y}px,
                    0px)`
            })
            
        }
        document.onmouseup = function(e){
            document.onmousemove = null
            document.onmouseleave = null
        }
        document.onmouseleave = function(e){
            document.onmousemove = null
            document.onmouseup = null
        }
    }
    // 控制滑动商品列表 ( 移动端适配 )
    document.ontouchstart = content_touch_event
    function content_touch_event(down_event){
        var down_x = down_event.changedTouches[0].clientX
        document.ontouchmove = function(move_event){
            var drop_x = move_event.changedTouches[0].clientX - down_x
            down_x = move_event.changedTouches[0].clientX
            rect_anim_position.forEach(function(item){
                item.x += drop_x
                if(item.x < sub_content_left){
                    item.x = sub_content_right
                }
                item.element.style.transform = `translate3d(
                    ${item.x}px,
                    ${item.y}px,
                    0px)`
            })
            
        }
        document.ontouchend = function(e){
            document.ontouchmove = null
        }
        document.ontouchcancel = function(e){
            document.ontouchmove = null
        }
    }
    /**
     * 
     * @param { center:object,rect_index:number } 
     * 返回当前选中某个子容器时四周受到影响的其他子容器
     */
    function involved_subs(center,rect_index){
        involved_sub_list = []
        rect_anim_position.forEach(function(item,index){
            if(rect_index !== index){
                // item.element.onclick = null     // 在已经选中一个元素的时候清除其他子容器的事件监听
                item.element.onclick = function(){
                    cancelAnimationFrame(circle_sub_animate_timer)  // 停止环形运动
                    rect_anim_position.forEach(function(item){
                        item.element.onclick = sub_content_click    // 重新设置事件监听
                    })
                    involved_sub_list.forEach(function(item2){
                        item2.element.style.transform = `translate3d(
                            ${item2.x}px,
                            ${item2.y}px,
                            0px)`
                    })
                    rect_anim_position[rect_index].element.style.transform = `translate3d(
                        ${rect_anim_position[rect_index].x}px,
                        ${rect_anim_position[rect_index].y}px,
                        0px)`
                        rect_anim_position[rect_index].element.style.transition = "0.5s"
                    setTimeout(function(){// 重新开始横向动作
                        involved_sub_list.forEach(function(item){
                            item.element.style.transition = "0s"
                        })
                        rect_anim_position[rect_index].element.style.transition = "0s"
                        rect_animate()                                  
                    },550)
                    return

                }
                if( Math.pow(item.x - center.x , 2 ) + Math.pow( item.y - center.y , 2 ) < Math.pow(sub_content_radius,2)){
                    // 确定到当前的受到影响的子容器
                    involved_sub_list.push(item)
                }
            }
        })
        return involved_sub_list
    }
    /**
     * 
     * @param { center:object, involved_sub_list:array } involved_sub_list 
     * 将受到影响的子容器向四周移动
     */
    function move_involved_subs(center,involved_sub_list){
        // 将受到波及的子容器向四周环形移动
        involved_sub_list.forEach(function(item){
            let aX = Math.abs(item.x - center.x)
            let aY = Math.abs(item.y - center.y)
            let aXY = Math.sqrt(aX*aX + aY*aY)

            let sinA = aY / aXY
            let cosA = aX / aXY

            let random_len = content_width/4 + sub_content_width*Math.random()
            let random_x = random_len*cosA
            let random_y = random_len*sinA

            item.element.style.transition = "0.5s"
            if(item.x >= center.x && item.y >= center.y){       // 右下角
                item.cx = center.x + random_x
                item.cy = center.y + random_y
                item.element.style.transform = `translate3d(
                    ${ center.x + random_x }px,
                    ${ center.y + random_y }px,
                    -${ content_perspective/2 }px)`
            }else if(item.x >= center.x && item.y < center.y){  // 右上角
                item.cx = center.x + random_x
                item.cy = center.y - random_y
                item.element.style.transform = `translate3d(
                    ${ center.x + random_x }px,
                    ${ center.y - random_y }px,
                    -${ content_perspective/2 }px)`
            }else if(item.x < center.x && item.y >= center.y){  // 左下角
                item.cx = center.x - random_x
                item.cy = center.y + random_y
                item.element.style.transform = `translate3d(
                    ${ center.x - random_x }px,
                    ${ center.y + random_y }px,
                    -${ content_perspective/2 }px)`
            }else{                                              // 左上角
                item.cx = center.x - random_x
                item.cy = center.y - random_y
                item.element.style.transform = `translate3d(
                    ${ center.x - random_x }px,
                    ${ center.y - random_y }px,
                    -${ content_perspective/2 }px)`
            }
            
        })

        // 环形子容器做环形运动
        setTimeout(function(){
            circle_sub_animate()
        },550)
    }

    function circle_sub_animate(){
        var mx = 1
        var d = 0.01 // Math.PI * 2
        involved_sub_list.forEach(function(item){
            var x1 = item.cx - content_center.x
            var y1 = item.cy - content_center.y
            if(x1 > 0 && y1 < 0){       // 右上
                var my = y1 + Math.sqrt(Math.pow(y1,2) + 2*x1*mx - Math.pow(mx,2))
                item.cx = item.cx - mx
                item.cy = item.cy - my
            }else if(x1 < 0 && y1 < 0){ // 左上
                var my = y1 + Math.sqrt(Math.pow(y1,2) - 2*x1*mx - Math.pow(mx,2))
                item.cx = item.cx - mx
                item.cy = item.cy + my
            }else if(x1 < 0 && y1 > 0){ // 左下
                var my = -y1 + Math.sqrt(Math.pow(y1,2) - 2*x1*mx - Math.pow(mx,2))
                item.cx = item.cx + mx
                item.cy = item.cy + my
            }else{                      // 右下
                var my = -y1 + Math.sqrt(Math.pow(y1,2) + 2*x1*mx - Math.pow(mx,2))
                item.cx = item.cx + mx
                item.cy = item.cy - my
            }
            // var r = Math.sqrt( Math.pow( x1, 2 ),Math.pow( y1, 2 ) )
            // if(x1 > 0 && y1 < 0){       // 右上
            //    var q = Math.acos(x1/r)
            //    console.log(q)
            //    console.log(r)
            //    console.log(x1)
            //    console.log('------')
            //    q += d
            //    item.cx = content_center.x + r*Math.cos(q)
            //    item.cy = content_center.y - r*Math.sin(q)
            //    item.cx = item.cx - ( x1 - r*Math.cos(q) )
            //    item.cy = item.cy - ( r*Math.sin(q) - y1 ) 
            // }else if(x1 < 0 && y1 < 0){ // 左上
               
            // }else if(x1 < 0 && y1 > 0){ // 左下
               
            // }else{                      // 右下
               
            // }
            item.element.style.transform = `translate3d(
                ${ item.cx }px,
                ${ item.cy }px,
                -${ content_perspective/2 }px)`
        })
        circle_sub_animate_timer = requestAnimationFrame(circle_sub_animate)
    }
    
    function mixin_img_arr(img_arr,sub_content_count){    // 控制传入的图片数组
        if(img_arr.length > sub_content_count){
            return img_arr.slice(0,sub_content_count)
        }else{
            var arr = []
            var len = img_arr.length 
            for(var i = 0;i < sub_content_count;i++){
                var index = Math.floor( Math.random() * ( len ) )
                arr.push(img_arr[index])
            }
            return arr
        }
    }
}
