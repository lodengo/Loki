module namespace cost = 'cost';

declare updating function cost:createFile($data){
  let $fileid:= random:uuid() 
  return(     
    db:create($fileid, <file><id>{$fileid}</id></file>, $fileid),       
    db:output(<result>{$fileid}</result>)
  )  
};

declare function cost:getCost($file, $id){
  copy $cost := doc($file)//cost[id=$id]
  modify(    
    delete node $cost/fees,
    delete node $cost/node()[name()='cost']
  )
  return $cost
};

declare updating function cost:insertCost($file, $data, $parentId){
  let $cost :=
  <cost>
  <id>{random:uuid()}</id>
  <file>{$file}</file>
  {$data/node()} 
  <fees></fees>
  </cost>
  
  let $parent := doc($file)//cost[id=$parentId] return
  if($parent) then (insert node $cost into $parent,  db:output($cost) )
  else (insert node $cost into doc($file), db:output($cost))   
};

declare updating function cost:deleteCost($file, $costId){
  delete node doc($file)//cost[id=$costId]
};

declare updating function cost:setCostProperty($file, $id, $prop, $value){
  let $node := doc($file)//cost[id=$id]/node()[name()=$prop]
  return if($node) then replace value of node $node with $value
  else insert node element {$prop} {$value} into doc($file)//cost[id=$id]
};

declare updating function cost:deleteCostProperty($file, $id, $prop){
  delete node doc($file)//cost[id=$id]/node()[name()=$prop]
};

declare function cost:feesToFlushOnCostCreate($file, $costId, $type){
  let $cost := doc($file)//cost[id=$costId]
  let $cost_fees := $cost/fees//fee 
  let $cost_parent_fees_cc := $cost/../fees//fee[matches(feeExpr, concat("cc.?\(", $type))]
  let $cost_sibling := $cost/../cost[id != $costId]
  let $cost_sibling_fees_cs := $cost_sibling/fees//fee[matches(feeExpr, "cs")]
  return <fees>{($cost_fees,$cost_parent_fees_cc,$cost_sibling_fees_cs)}</fees>
};

declare function cost:feesToFlushOnCostUpdate($file, $costId, $type, $key){
  let $cost := doc($file)//cost[id=$costId]
  let $cost_fees := $cost/fees//fee[matches(feeExpr, concat("cas\(", $key, "|c\(", $key))]
  let $cost_parent_fees := $cost/../fees//fee[matches(feeExpr, concat("cc\(", $type, ",", $key))]
  let $cost_sibling := $cost/../cost[id != $costId]
  let $cost_sibling_fees := $cost_sibling/fees//fee[matches(feeExpr, concat("cs\(", $key))]
  let $cost_descendant_fees := $cost//cost/fees/fee[matches(feeExpr, concat("cas\(", $key))]
  return <fees>{($cost_fees,$cost_parent_fees, $cost_sibling_fees, $cost_descendant_fees)}</fees>
};

declare function cost:feesToFlushOnCostDelete($file, $costId, $type){
  let $cost := doc($file)//cost[id=$costId]
  let $cost_parent_fees := $cost/../fees//fee[matches(feeExpr, concat("cc\(", $type))]
  let $cost_sibling := $cost/../cost[id != $costId]
  let $cost_sibling_fees := $cost_sibling/fees//fee[matches(feeExpr, "cs\(")]
  return <fees>{($cost_parent_fees, $cost_sibling_fees)}</fees>
};

declare function cost:getFee($file, $id){
  copy $fee := doc($file)//fee[id=$id]
  modify(delete node $fee/fee, delete node $fee/refTo, delete node $fee/refFrom)
  return $fee
};

declare updating function cost:createFee($file, $data, $costId, $costType, $parentId){
  let $info := <info>
   <file>{$file}</file>
   <costId>{$costId}</costId>
   <costType>{$costType}</costType></info>
   
  let $fee := copy $fee := $data
  modify(
    for $fe in $fee//fee return( 
    insert node <id>{random:uuid()}</id> into $fe,
    insert node $info/node() into $fe
    )
  )
  return $fee/fee
    
  let $parent := doc($file)//fee[id=$parentId] return
  if($parent) then (insert node $fee into $parent,  db:output($fee) )
  else (insert node $fee into doc($file)//cost[id=$costId]/fees, db:output($fee))   
};

declare updating function cost:setFeeProperty($file, $id, $prop, $value){
  let $node := doc($file)//fee[id=$id]/node()[name()=$prop]
  return if($node) then replace value of node $node with $value
  else insert node element {$prop} {$value} into doc($file)//fee[id=$id]
};

declare updating function cost:deleteFeeProperty($file, $id, $prop){
  delete node doc($file)//fee[id=$id]/node()[name()=$prop]
};

declare updating function cost:deleteFee($file, $id){
  delete node doc($file)//fee[id=$id]
};

declare updating function cost:setFeeResult($file, $id, $result){
  replace value of node doc($file)//fee[id=$id]/feeResult with $result
};

declare function cost:feesAdj($file, $ids){
  <result>{
    for $id in $ids/id/text()
    let $fee := doc($file)//fee[id=$id] return
    <adj>
     {$fee/id}
     {$fee/refTo}
     {$fee/refFrom}  
    </adj>  
  }</result>
};

declare function cost:feesToFlushOnFeeCreate($file, $costId, $type, $feeName){
  let $cost := doc($file)//cost[id=$costId]
  let $cost_fees := $cost/fees//fee[matches(feeExpr, concat("cf\(", $feeName))]
  let $cost_parent_fees := $cost/../fees//fee[matches(feeExpr, concat("ccf\(", $type, ",", $feeName))]
  let $cost_sibling := $cost/../cost[id != $costId]
  let $cost_sibling_fees := $cost_sibling/fees//fee[matches(feeExpr, concat("csf\(", $feeName))]
  return <fees>{($cost_fees,$cost_parent_fees, $cost_sibling_fees)}</fees>
};

declare updating function cost:createRefsTo($file, $fromFeeId, $toIds){
  let $fee := doc($file)//fee[id=$fromFeeId]
  return for $toId in $toIds/id/text() return(
    let $toNode := doc($file)//id[text()=$toId]/.. 
    return (
      if($fee/refTo[text()=$toId])
      then ()
      else insert node <refTo>{$toId}</refTo>into $fee
      ,
      if($toNode/refFrom[text()=$fromFeeId]) then () 
      else insert node <refFrom>{$fromFeeId}</refFrom> into $toNode
    )   
  )  
};

declare updating function cost:removeRefsTo($file, $fromFeeId, $toIds){
  let $fee := doc($file)//fee[id=$fromFeeId]
  return for $toId in $toIds/id/text() return(
    let $toNode := doc($file)//id[text()=$toId]/.. 
    return (
      delete node $fee/refTo[text()=$toId],    
      delete node $toNode/refFrom[text()=$fromFeeId]
    )   
  )  
};

declare function cost:feeRefedToIds($file, $id){
  <result>
  {doc($file)//fee[id=$id]/refTo}
  </result>
};

declare function cost:_C($file, $costId, $prop){
   <results>{
  let $cost := doc($file)//cost[id=$costId]
  return <result><id>{$costId}</id><value>{$cost/node()[name()=$prop]/text()}</value></result>
   }</results>
};

declare function cost:_CF($file, $costId, $feeName){
   <results>{
  let $fee := doc($file)//cost[id=$costId]/fees//fee[feeName=$feeName]
  return <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
   }</results>
};

declare function cost:_CC($file, $costId, $type, $prop){
  <results>{
  let $costs := doc($file)//cost[id=$costId]/cost[type=$type]
  for $cost in $costs return
  <result><id>{$cost/id/text()}</id><value>{$cost/node()[name=$prop]/text()}</value></result>
  }</results>
 
};

declare function cost:_CCF($file, $costId, $type, $feeName){
  <results>{
  let $fees := doc($file)//cost[id=$costId]/cost[type=$type]/fees//fee[feeName=$feeName]
  for $fee in $fees return
   <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
   }</results>
};

declare function cost:_CS($file, $costId, $prop){
  <results>{
  let $costs := doc($file)//cost[id=$costId]/../cost[id != $costId]
  for $cost in $costs return
   <result><id>{$cost/id/text()}</id><value>{$cost/node()[name()=$prop]/text()}</value></result>
  }</results>
};

declare function cost:_CSF($file, $costId, $feeName){
  <results>{
  let $fees := doc($file)//cost[id=$costId]/../cost/fees//fee[feeName=$feeName]
  for $fee in $fees return
   <result><id>{$fee/id/text()}</id><value>{$fee/feeResult/text()}</value></result>
  }</results>
};

declare function cost:self_parent($cost, $prop){
  let $node := $cost/node()[name()=$prop] return
  if($node) then  <result><id>{$cost/id/text()}</id><value>{$node/text()}</value></result>
  else cost:self_parent($cost/.., $prop)
};

declare function cost:_CAS($file, $costId, $prop){
  <results>{
  let $cost := doc($file)//cost[id=$costId]
  return cost:self_parent($cost, $prop)
  }</results>
};

